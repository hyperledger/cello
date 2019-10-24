#
# SPDX-License-Identifier: Apache-2.0
#
import json
import subprocess
import tarfile
from time import sleep

import requests

from network import FabricNetwork
from utils.env import (
    NODE_ID,
    NODE_DETAIL_URL,
    AGENT_ID,
    AGENT_IP,
    NETWORK_VERSION,
    NODE_TYPE,
    MAX_QUERY_RETRY,
    headers,
    NodeStatus,
    NODE_UPLOAD_FILE_URL,
    NETWORK_TYPE,
    NetworkType,
    FabricNodeType,
)
from utils import get_k8s_client


def _upload_ca_crypto(pod):
    copy_cmd = [
        "kubectl",
        "cp",
        "%s/%s:/etc/hyperledger/fabric-ca-server/crypto"
        % (AGENT_ID, pod.metadata.name),
        "crypto",
    ]
    subprocess.call(copy_cmd)
    crypto_tar_file = "crypto.tgz"
    tf = tarfile.open(crypto_tar_file, mode="w:gz")
    tf.add("crypto")
    tf.close()

    files = {"file": open(crypto_tar_file, "rb")}
    del headers["Content-Type"]
    r = requests.post(NODE_UPLOAD_FILE_URL, headers=headers, files=files)


def _generate_peer_env_from_ports(ports=None):
    if ports is None:
        ports = []

    environments = []
    for port in ports:
        internal_port = port.get("internal")
        external_port = port.get("external")
        if internal_port == 7051:
            environments += [
                {
                    "name": "CORE_PEER_ADDRESS",
                    "value": "%s:%s" % (AGENT_IP, external_port),
                },
                {
                    "name": "CORE_PEER_GOSSIP_EXTERNALENDPOINT",
                    "value": "%s:%s" % (AGENT_IP, external_port),
                },
            ]
        elif internal_port == 7052:
            environments += [
                {
                    "name": "CORE_PEER_CHAINCODEADDRESS",
                    "value": "%s:%s" % (AGENT_IP, external_port),
                },
                {
                    "name": "CORE_PEER_CHAINCODELISTENADDRESS",
                    "value": "0.0.0.0:%s" % external_port,
                },
            ]

    return environments


def _create_fabric_node():
    k8s_client = get_k8s_client()

    network = FabricNetwork(
        version=NETWORK_VERSION,
        node_type=NODE_TYPE,
        agent_id=AGENT_ID,
        node_id=NODE_ID,
    )

    service = network.service()

    deploy_name = None
    ports = []
    new_environments = []
    if service:
        success, service_response = k8s_client.create_service(
            AGENT_ID, **service
        )
        if service.get("service_type") == "NodePort" and success:
            ports = service_response.spec.ports
            ports = [
                {"external": port.node_port, "internal": port.port}
                for port in ports
            ]
            if NODE_TYPE == FabricNodeType.Peer.value:
                new_environments = _generate_peer_env_from_ports(ports)

    # add new environments depend on service result
    if len(new_environments) > 0:
        network.add_environments(new_environments)

    deployment = network.deployment()
    for key, value in deployment.items():
        print(key, value)
    if deployment:
        k8s_client.create_deployment(AGENT_ID, **deployment)
        deploy_name = deployment.get("name")
    # if service:
    #     success, service_response = k8s_client.create_service(
    #         AGENT_ID, **service
    #     )
    #     if service.get("service_type") == "NodePort" and success:
    #         ports = service_response.spec.ports
    #         ports = [
    #             {"external": port.node_port, "internal": port.port}
    #             for port in ports
    #         ]
    # if ingress:
    #     k8s_client.create_ingress(AGENT_ID, **ingress)
    #
    # The pod of node deployed in kubernetes
    pod = None
    # Query pod status if is Running
    node_status = NodeStatus.Error.value
    for i in range(1, MAX_QUERY_RETRY):
        pod = k8s_client.get_pod(AGENT_ID, deploy_name)
        if pod and pod.status.phase == "Running":
            node_status = NodeStatus.Running.value
            break
        sleep(5)

    # Update node status
    ret = requests.put(
        url=NODE_DETAIL_URL,
        headers=headers,
        data=json.dumps({"status": node_status, "ports": ports}),
    )

    if node_status == NodeStatus.Running.value:
        # if deploy success and node type is ca,
        # will upload the crypto files to api engine
        if NODE_TYPE == "ca":
            _upload_ca_crypto(pod)


def create_node():
    if NETWORK_TYPE == NetworkType.Fabric.value:
        _create_fabric_node()
