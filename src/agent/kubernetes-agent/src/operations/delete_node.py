#
# SPDX-License-Identifier: Apache-2.0
#
import json
from time import sleep

import requests

from network import FabricNetwork
from utils.env import (
    AGENT_ID,
    NODE_TYPE,
    NETWORK_VERSION,
    NODE_ID,
    NETWORK_TYPE,
    NetworkType,
    NODE_DETAIL_URL,
    headers,
    MAX_QUERY_RETRY,
)
from utils import get_k8s_client


def _delete_fabric_node():
    k8s_client = get_k8s_client()

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

    deploy_name = None
    if ingress:
        k8s_client.delete_ingress(namespace=AGENT_ID, name=ingress.get("name"))
    if service:
        k8s_client.delete_service(namespace=AGENT_ID, name=service.get("name"))
    if deployment:
        k8s_client.delete_deployment(
            namespace=AGENT_ID, name=deployment.get("name")
        )
        deploy_name = deployment.get("name")

    for i in range(1, MAX_QUERY_RETRY):
        pod = k8s_client.get_pod(AGENT_ID, deploy_name)
        if pod is None:
            requests.put(
                url=NODE_DETAIL_URL,
                headers=headers,
                data=json.dumps({"status": "deleted"}),
            )
            requests.delete(url=NODE_DETAIL_URL, headers=headers)
            break
        sleep(5)


def delete_node():
    if NETWORK_TYPE == NetworkType.Fabric.value:
        _delete_fabric_node()
