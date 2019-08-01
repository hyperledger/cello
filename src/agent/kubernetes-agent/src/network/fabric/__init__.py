#
# SPDX-License-Identifier: Apache-2.0
#
import os
import logging
from utils.env import (
    PEER_CONFIG,
    CA_CONFIG,
    CA_ADMIN_NAME,
    CA_ADMIN_PASSWORD,
    AGENT_IP,
    FabricNodeType,
    FabricImages,
)

LOG = logging.getLogger(__name__)
CA_HOSTS = CA_CONFIG.get("hosts", "").split(",")
# Set fabric ca hosts from agent ip and user customize hosts.
CA_HOSTS.append(AGENT_IP)


class FabricNetwork(object):
    def __init__(self, *args, **kwargs):
        self._version = kwargs.get("version")
        self._type = kwargs.get("node_type")
        self._agent_id = kwargs.get("agent_id")
        self._node_id = kwargs.get("node_id")
        self._deploy_name = "deploy-%s" % str(self._node_id)
        self._service_name = "service-%s" % str(self._node_id)
        self._ingress_name = "ingress-%s" % str(self._node_id)
        self._container_image = ""
        self._container_environments = None
        self._container_command = None
        self._container_command_args = None
        self._initial_containers = None
        self._container_volume_mounts = None
        self._containers = None
        self._initial_containers = None
        self._volumes = None

        if self._type == FabricNodeType.Ca.value:
            self._container_ports = [7054]
            self._service_ports = [{"port": 7054, "name": "server"}]
            self._image_name = "%s:%s" % (FabricImages.Ca.value, self._version)
            self._pod_name = "ca-server"
            self._init_ca_deployment()
        elif self._type == FabricNodeType.Peer.value:
            self._container_ports = [7051, 7052]
            self._service_ports = [
                {"port": 7051, "name": "server"},
                {"port": 7052, "name": "grpc"},
            ]
            self._image_name = "%s:%s" % (
                FabricImages.Peer.value,
                self._version,
            )
            self._pod_name = "peer"
            self._init_peer_deployment()
        else:
            self._container_ports = []
            self._service_ports = []
            self._image_name = ""
            self._pod_name = ""

    def _init_ca_deployment(self):
        self._container_environments = [
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
        self._container_command = ["fabric-ca-server"]
        self._container_command_args = [
            "start",
            "-b",
            "%s:%s" % (CA_ADMIN_NAME, CA_ADMIN_PASSWORD),
            "-d",
        ]

    def _init_peer_deployment(self):
        gossip_use_leader_reflection = PEER_CONFIG.get(
            "gossip_use_leader_reflection", True
        )
        gossip_org_leader = PEER_CONFIG.get("gossip_org_leader", False)
        gossip_skip_handshake = PEER_CONFIG.get("gossip_skip_handshake", True)
        name = PEER_CONFIG.get("name")
        local_msp_id = PEER_CONFIG.get("local_msp_id")
        ca_list = PEER_CONFIG.get("ca_list", [])

        initial_container_work_dir = "/work-dir"
        # TODO: find a policy for peer directory definition
        initial_container_environments = [
            {
                "name": "FABRIC_CA_CLIENT_HOME",
                "value": "%s/hyperledger/org1/peer1"
                % initial_container_work_dir,
            },
            {"name": "PEER_NAME", "value": name},
        ]
        for ca_node in ca_list:
            ca_address = ca_node.get("address")
            ca_certificate_url = ca_node.get("certificate")
            ca_certificate_file_name = ca_certificate_url.split("/")[-1]
            ca_certificate_file_type = (
                "archive"
                if ca_certificate_file_name.endswith((".tgz", "tar.gz"))
                else "file"
            )
            ca_type = ca_node.get("type").upper()
            users = ca_node.get("users", [])
            ca_environments = [
                {"name": "%s_CA_ADDRESS" % ca_type, "value": ca_address},
                {
                    "name": "%s_CA_CERTIFICATE_URL" % ca_type,
                    "value": ca_certificate_url,
                },
                {
                    "name": "%s_CA_CERTIFICATE_FILE_NAME" % ca_type,
                    "value": ca_certificate_file_name,
                },
                {
                    "name": "%s_CA_CERTIFICATE_FILE_TYPE" % ca_type,
                    "value": ca_certificate_file_type,
                },
            ]
            for user in users:
                user_type = user.get("type").upper()
                username = user.get("username")
                password = user.get("password")
                ca_environments += [
                    {
                        "name": "%s_%s_USER_NAME" % (ca_type, user_type),
                        "value": username,
                    },
                    {
                        "name": "%s_%s_USER_PASSWORD" % (ca_type, user_type),
                        "value": password,
                    },
                ]
            initial_container_environments = (
                initial_container_environments + ca_environments
            )

        initial_container_command = ["bash", "-c"]
        script_file_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "peer_initial_ca.sh"
        )
        # read script for peer initial
        with open(script_file_path, "r") as initial_ca_script:
            shell_script = initial_ca_script.read()
        initial_container_command_args = [shell_script]
        ca_image = "%s:%s" % (FabricImages.Ca.value, self._version)

        self._initial_containers = [
            {
                "image": ca_image,
                "environments": initial_container_environments,
                "name": "initial-ca",
                "command": initial_container_command,
                "command_args": initial_container_command_args,
                "volume_mounts": [{"name": "workdir", "path": "/work-dir"}],
            }
        ]
        self._volumes = [
            {"name": "workdir", "empty_dir": {}},
            {"name": "docker-run", "host_path": "/var/run"},
        ]
        self._container_environments = [
            {"name": "CORE_PEER_ID", "value": name},
            {"name": "CORE_PEER_LOCALMSPID", "value": local_msp_id},
            {
                "name": "CORE_PEER_MSPCONFIGPATH",
                "value": "/work-dir/hyperledger/org1/peer1/msp",
            },
            {
                "name": "CORE_VM_ENDPOINT",
                "value": "unix:///host/var/run/docker.sock",
            },
            {
                "name": "CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE",
                "value": "guide_fabric-ca",
            },
            {"name": "FABRIC_LOGGING_SPEC", "value": "debug"},
            {"name": "CORE_PEER_TLS_ENABLED", "value": "true"},
            {
                "name": "CORE_PEER_TLS_CERT_FILE",
                "value": "/work-dir/hyperledger/org1/peer1/tls-msp/signcerts/cert.pem",
            },
            {
                "name": "CORE_PEER_TLS_KEY_FILE",
                "value": "/work-dir/hyperledger/org1/peer1/tls-msp/keystore/key.pem",
            },
            {
                "name": "CORE_PEER_GOSSIP_USELEADERELECTION",
                "value": "true" if gossip_use_leader_reflection else "false",
            },
            {
                "name": "CORE_PEER_GOSSIP_ORGLEADER",
                "value": "true" if gossip_org_leader else "false",
            },
            {
                "name": "CORE_PEER_GOSSIP_SKIPHANDSHAKE",
                "value": "true" if gossip_skip_handshake else "false",
            },
            {
                "name": "CORE_PEER_TLS_ROOTCERT_FILE",
                "value": "/work-dir/hyperledger/org1/peer1/tls-msp/tlscacerts/tls.pem",
            },
        ]
        self._container_volume_mounts = [
            {"name": "workdir", "path": "/work-dir"},
            {"name": "docker-run", "path": "/host/var/run"},
        ]

    # def _generate_ingress(self):
    #     ingress_name = "ingress-%s" % str(self._node_id)
    #     annotations = {"nginx.ingress.kubernetes.io/ssl-redirect": "false"}
    #     if self._type == FabricNodeType.Ca.name.lower():
    #         ingress_paths = [
    #             {"port": 7054, "path": "/%s" % str(self._node_id)}
    #         ]
    #     else:
    #         ingress_paths = []
    #
    #     return {
    #         "name": ingress_name,
    #         "service_name": self._service_name,
    #         "ingress_paths": ingress_paths,
    #         "annotations": annotations,
    #     }

    def add_environments(self, environments=None):
        if environments is None:
            environments = []

        self._container_environments += environments

    def deployment(self):
        deployment = {"name": self._deploy_name}
        if self._volumes is not None:
            deployment.update({"volumes": self._volumes})
        if self._initial_containers is not None:
            deployment.update({"initial_containers": self._initial_containers})
        container_dict = {
            "image": self._image_name,
            "name": self._pod_name,
            "ports": self._container_ports,
        }
        if self._container_environments is not None:
            container_dict.update(
                {"environments": self._container_environments}
            )
        if self._container_volume_mounts is not None:
            container_dict.update(
                {"volume_mounts": self._container_volume_mounts}
            )
        if self._container_command is not None:
            container_dict.update({"command": self._container_command})
        if self._container_command_args is not None:
            container_dict.update(
                {"command_args": self._container_command_args}
            )
        containers = [container_dict]
        deployment.update({"containers": containers})

        return deployment

    def service(self):
        return {
            "name": self._service_name,
            "ports": self._service_ports,
            "selector": {"app": self._deploy_name},
            "service_type": "NodePort",
        }
