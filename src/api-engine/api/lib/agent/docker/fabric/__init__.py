#
# SPDX-License-Identifier: Apache-2.0
#
import logging

from api.lib.agent.network_base import NetworkBase
from api.common.enums import FabricNodeType
from api.utils.port_picker import find_available_ports, set_ports_mapping

LOG = logging.getLogger(__name__)

CA_IMAGE_NAME = "hyperledger/fabric-ca"


class FabricNetwork(NetworkBase):
    def __init__(self, *args, **kwargs):
        super(FabricNetwork, self).__init__(*args, **kwargs)

        self._version = kwargs.get("version")
        self._type = kwargs.get("node_type")
        self._agent_id = kwargs.get("agent_id")
        self._node_id = kwargs.get("node_id")
        self._docker_host = kwargs.get("docker_host")
        self._docker_host_ip = self._docker_host.split(":")[1].split("//")[-1]
        self._compose_file_version = kwargs.get("compose_file_version", "3.2")
        self._template = {"version": self._compose_file_version}

    def _generate_ca_compose_yaml(self):
        environment = ["FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server"]
        internal_ports = [7054]
        ports = find_available_ports(
            self._docker_host_ip, self._node_id, self._agent_id
        )
        if not len(ports):
            return None
        ports_mapping = [
            {"external": ports[i], "internal": internal_ports[i]}
            for i in range(len(ports))
        ]
        set_ports_mapping(self._node_id, ports_mapping)
        self._template.update(
            {
                "services": {
                    self._type: {
                        "image": "%s:%s" % (CA_IMAGE_NAME, self._version),
                        "environment": environment,
                        "ports": ["%s:7054" % ports[0]],
                        "command": "sh -c 'fabric-ca-server start "
                        "--ca.certfile "
                        "/etc/hyperledger/fabric-ca-server-config"
                        "/ca.org1.example.com-cert.pem "
                        "--ca.keyfile "
                        "/etc/hyperledger/fabric-ca-server-config/"
                        "CA1_PRIVATE_KEY -b admin:adminpw -d'",
                    }
                }
            }
        )

        return self._template

    def generate_config(self, *args, **kwargs):
        if self._type == FabricNodeType.Ca.name.lower():
            return self._generate_ca_compose_yaml()
