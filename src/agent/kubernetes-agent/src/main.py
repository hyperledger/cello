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
    Create = "create"
    Start = "start"
    Stop = "stop"
    Query = "query"
    Update = "update"
    Delete = "delete"
    FabricCARegister = "fabric:ca:register"


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
AGENT_IP = os.getenv("AGENT_IP")
NODE_ID = os.getenv("NODE_ID")
OPERATION = os.getenv("OPERATION")
TOKEN = os.getenv("TOKEN")
NODE_DETAIL_URL = os.getenv("NODE_DETAIL_URL")
NODE_FILE_URL = os.getenv("NODE_FILE_URL")
NODE_SERVICE_PORT = os.getenv("NODE_SERVICE_PORT")
NODE_UPLOAD_FILE_URL = os.getenv("NODE_UPLOAD_FILE_URL")
MAX_QUERY_RETRY = 30
FABRIC_CA_USER = json.loads(os.getenv("FABRIC_CA_USER", "{}"))
SERVICE_PORTS = json.loads(os.getenv("SERVICE_PORTS", "{}"))
USER_PATCH_URL = os.getenv("USER_PATCH_URL")

CA_CONFIG = json.loads(os.getenv("FABRIC_CA_CONFIG", "{}"))
# Initial admin name/password for ca server
CA_ADMIN_NAME = CA_CONFIG.get("admin_name", "admin")
CA_ADMIN_PASSWORD = CA_CONFIG.get("admin_password", "adminpw")

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

    if OPERATION == AgentOperation.Create.value:
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
            url=NODE_DETAIL_URL,
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
        deploy_name = None
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
    elif OPERATION == AgentOperation.FabricCARegister.value:
        node_file = None
        if NODE_FILE_URL:
            node_file = download_file(NODE_FILE_URL, "/tmp")
            tf = tarfile.open(node_file)
            tf.extractall("/tmp")

            name = FABRIC_CA_USER.get("name")
            secret = FABRIC_CA_USER.get("secret")
            user_type = FABRIC_CA_USER.get("type")
            attrs = FABRIC_CA_USER.get("attrs", "")

            ca_service_port = SERVICE_PORTS.get("7054")

            enroll_cmd = [
                "fabric-ca-client",
                "enroll",
                "-d",
                "-u",
                "https://%s:%s@%s:%s"
                % (
                    CA_ADMIN_NAME,
                    CA_ADMIN_PASSWORD,
                    AGENT_IP,
                    ca_service_port,
                ),
            ]

            try:
                output = subprocess.check_call(enroll_cmd)
            except subprocess.CalledProcessError:
                requests.patch(
                    url=USER_PATCH_URL,
                    headers=headers,
                    data=json.dumps({"status": "fail"}),
                )
                exit(-1)

            register_cmd = [
                "fabric-ca-client",
                "register",
                "-d",
                "--id.name",
                name,
                "--id.secret",
                secret,
                "--id.type",
                user_type,
            ]
            if attrs != "":
                register_cmd.append("--id.attrs")
                register_cmd.append(attrs)

            register_cmd.append("-u")
            register_cmd.append("https://%s:%s" % (AGENT_IP, ca_service_port))

            try:
                output = subprocess.check_output(register_cmd)
            except subprocess.CalledProcessError:
                requests.patch(
                    url=USER_PATCH_URL,
                    headers=headers,
                    data=json.dumps({"status": "fail"}),
                )

            requests.patch(
                url=USER_PATCH_URL,
                headers=headers,
                data=json.dumps({"status": "registered"}),
            )
