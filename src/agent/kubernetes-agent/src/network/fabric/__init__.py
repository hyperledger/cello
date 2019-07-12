#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import os
import json

from enum import Enum, unique

LOG = logging.getLogger(__name__)
CA_CONFIG = json.loads(os.getenv("FABRIC_CA_CONFIG", "{}"))
# Initial admin name/password for ca server
CA_ADMIN_NAME = CA_CONFIG.get("admin_name", "admin")
CA_ADMIN_PASSWORD = CA_CONFIG.get("admin_password", "adminpw")
CA_HOSTS = CA_CONFIG.get("hosts", "").split(",")
AGENT_IP = os.getenv("AGENT_IP", "")
# Set fabric ca hosts from agent ip and user customize hosts.
CA_HOSTS.append(AGENT_IP)


@unique
class FabricNodeType(Enum):
    Ca = "ca"
    Orderer = "orderer"
    Peer = "peer"


CA_IMAGE_NAME = "hyperledger/fabric-ca"


class FabricNetwork(object):
    def __init__(self, *args, **kwargs):
        self._version = kwargs.get("version")
        self._type = kwargs.get("node_type")
        self._agent_id = kwargs.get("agent_id")
        self._node_id = kwargs.get("node_id")

    def _generate_deployment(self):
        containers = []
        name = str(self._node_id)
        name = "deploy-%s" % name
        if self._type == FabricNodeType.Ca.name.lower():
            image = "%s:%s" % (CA_IMAGE_NAME, self._version)
            environments = [
                {
                    "name": "FABRIC_CA_HOME",
                    "value": "/etc/hyperledger/fabric-ca-server",
                },
                {
                    "name": "FABRIC_CA_SERVER_HOME",
                    "value": "/etc/hyperledger/fabric-ca-server/crypto",
                },
                {"name": "FABRIC_CA_SERVER_TLS_ENABLED", "value": "true"},
                {
                    "name": "FABRIC_CA_SERVER_CSR_HOSTS",
                    "value": ",".join(CA_HOSTS),
                },
            ]
            ports = [7054]
            command = ["fabric-ca-server"]
            command_args = [
                "start",
                "-b",
                "%s:%s" % (CA_ADMIN_NAME, CA_ADMIN_PASSWORD),
                "-d",
            ]
            containers.append(
                {
                    "image": image,
                    "environments": environments,
                    "name": "ca",
                    "ports": ports,
                    "command": command,
                    "command_args": command_args,
                }
            )
        return {"containers": containers, "name": name}

    def _generate_service(self):
        name = str(self._node_id)
        deploy_name = "deploy-%s" % name
        service_name = "service-%s" % name
        ports = []
        if self._type == FabricNodeType.Ca.name.lower():
            ports = [7054]

        return {
            "name": service_name,
            "ports": ports,
            "selector": {"app": deploy_name},
            "service_type": "NodePort",
        }

    def _generate_ingress(self):
        name = str(self._node_id)
        service_name = "service-%s" % name
        ingress_name = "ingress-%s" % name
        ingress_paths = []
        annotations = {"nginx.ingress.kubernetes.io/ssl-redirect": "false"}
        if self._type == FabricNodeType.Ca.name.lower():
            ingress_paths = [{"port": 7054, "path": "/%s" % name}]

        return {
            "name": ingress_name,
            "service_name": service_name,
            "ingress_paths": ingress_paths,
            "annotations": annotations,
        }

    def generate_config(self, *args, **kwargs):
        config = {
            "deployment": self._generate_deployment(),
            "service": self._generate_service(),
            # "ingress": self._generate_ingress(),
        }

        return config
