#
# SPDX-License-Identifier: Apache-2.0
#
import os
import zipfile
import requests
import json
import subprocess
import tarfile
from time import sleep
from utils import download_file, KubernetesClient
from network import FabricNetwork
from enum import Enum, unique


@unique
class AgentOperation(Enum):
    Start = "start"
    Query = "query"
    Update = "update"
    Delete = "delete"


@unique
class NodeStatus(Enum):
    Deploying = "deploying"
    Running = "running"
    Stopped = "stopped"
    Deleting = "deleting"
    Error = "error"


AGENT_URL = os.getenv("AGENT_URL")
DEPLOY_NAME = os.getenv("DEPLOY_NAME")
NETWORK_TYPE = os.getenv("NETWORK_TYPE")
NETWORK_VERSION = os.getenv("NETWORK_VERSION")
NODE_TYPE = os.getenv("NODE_TYPE")
AGENT_CONFIG_FILE = os.getenv("AGENT_CONFIG_FILE")
AGENT_ID = os.getenv("AGENT_ID")
NODE_ID = os.getenv("NODE_ID")
OPERATION = os.getenv("OPERATION")
TOKEN = os.getenv("TOKEN")
NODE_UPDATE_URL = os.getenv("NODE_UPDATE_URL")
NODE_UPLOAD_FILE_URL = os.getenv("NODE_UPLOAD_FILE_URL")
MAX_QUERY_RETRY = 10

if __name__ == "__main__":
    config_file = download_file(AGENT_CONFIG_FILE, "/tmp")
    ext = os.path.splitext(config_file)[-1].lower()

    if ext == ".zip":
        with zipfile.ZipFile(config_file, "r") as zip_ref:
            zip_ref.extractall("/app")

    k8s_config = "/app/.kube/config"

    k8s_client = KubernetesClient(config_file=k8s_config)
    k8s_client.get_or_create_namespace(name=AGENT_ID)
    network = FabricNetwork(
        version=NETWORK_VERSION,
        node_type=NODE_TYPE,
        agent_id=AGENT_ID,
        node_id=NODE_ID,
    )
    config = network.generate_config()

    deployment = config.get("deployment")
    service = config.get("service")
    ingress = config.get("ingress")

    # authorization headers for call update api
    headers = {
        "Authorization": "JWT %s" % TOKEN,
        "Content-Type": "application/json",
    }
    ports = []

    if OPERATION == AgentOperation.Start.value:
        deploy_name = None
        if deployment:
            k8s_client.create_deployment(AGENT_ID, **deployment)
            deploy_name = deployment.get("name")
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
        if ingress:
            k8s_client.create_ingress(AGENT_ID, **ingress)

        ret = requests.put(
            url=NODE_UPDATE_URL,
            headers=headers,
            data=json.dumps(
                {"status": NodeStatus.Running.value, "ports": ports}
            ),
        )

        if deploy_name and NODE_TYPE == "ca":
            pod = None
            for i in range(1, MAX_QUERY_RETRY):
                pod = k8s_client.get_pod(AGENT_ID, deploy_name)
                if pod.status.phase == "Running":
                    break
                sleep(5)
            if pod:
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
                r = requests.post(
                    NODE_UPLOAD_FILE_URL, headers=headers, files=files
                )
    elif OPERATION == AgentOperation.Delete.value:
        if ingress:
            k8s_client.delete_ingress(
                namespace=AGENT_ID, name=ingress.get("name")
            )
        if service:
            k8s_client.delete_service(
                namespace=AGENT_ID, name=service.get("name")
            )
        if deployment:
            k8s_client.delete_deployment(
                namespace=AGENT_ID, name=deployment.get("name")
            )
