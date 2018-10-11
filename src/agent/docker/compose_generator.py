
# Copyright 2018 (c) VMware, Inc. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
#

import yaml
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from common import HLF_VERSION, HLF_VERSION_1_2

# FIXME: will dynamic generate crypto config to replace static files.
CERT_FILES = {
    "fabric-1.0": [
        "0e729224e8b3f31784c8a93c5b8ef6f4c1c91d9e6e577c45c33163609fe40011_sk",
        "a7d47efa46a6ba07730c850fed2c1375df27360d7227f48cdc2f80e505678005_sk"
    ],
    "fabric-1.2": [
        "ca_sk",
        "ca_sk"
    ]
}

IMAGE_VERSIONS = {
    "fabric-1.0": HLF_VERSION,
    "fabric-1.2": HLF_VERSION_1_2,
}

# FIXME: ca name need be unique
CA_NAME_PREFIX = {
    "fabric-1.0": "ca_peerOrg",
    "fabric-1.2": "ca-org"
}


class ComposeGenerator(object):
    def __init__(self, config=None):
        self._config = config if config else {}
        self._size = int(config.get("size", "4"))
        self._org_count = int(self._size / 2)
        self._config_file = config.get("config_file", "")
        self._network_type = config.get("network_type", "fabric-1.0")
        self._consensus_plugin = config.get("consensus_plugin", "solo")

    @staticmethod
    def _generate_peer_config(peer_num, org_num, image_version):
        msp_volumes = "crypto-config/peerOrganizations/" \
                      "org{org_num}.example.com/peers/" \
                      "peer{peer_num}.org{org_num}.example.com/" \
                      "msp:/etc/hyperledger/fabric/msp". \
            format(peer_num=peer_num, org_num=org_num)
        tls_volumes = "crypto-config/peerOrganizations/" \
                      "org{org_num}.example.com/peers/" \
                      "peer{peer_num}.org{org_num}.example.com/" \
                      "tls:/etc/hyperledger/fabric/tls". \
            format(peer_num=peer_num, org_num=org_num)
        return {
            "image": "hyperledger/fabric-peer:%s" % image_version,
            "container_name":
                "${COMPOSE_PROJECT_NAME}_peer%s_org%s"
                % (peer_num, org_num),
            "restart": "always",
            "depends_on": ["orderer.example.com"],
            "environment": [
                "CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE="
                "${COMPOSE_PROJECT_NAME}_default",
                "CORE_LOGGING_LEVEL=DEBUG",
                "CORE_PEER_GOSSIP_USELEADERELECTION=true",
                "CORE_PEER_GOSSIP_ORGLEADER=false",
                "CORE_PEER_GOSSIP_SKIPHANDSHAKE=true",
                "CORE_PEER_TLS_ENABLED=true",
                "CORE_PEER_TLS_CERT_FILE="
                "/etc/hyperledger/fabric/tls/server.crt",
                "CORE_PEER_TLS_KEY_FILE="
                "/etc/hyperledger/fabric/tls/server.key",
                "CORE_PEER_TLS_ROOTCERT_FILE="
                "/etc/hyperledger/fabric/tls/ca.crt",
                "CORE_VM_DOCKER_HOSTCONFIG_MEMORY=268435456",
                "CORE_PEER_ID=peer%s.org%s.example.com" %
                (peer_num, org_num),
                "CORE_PEER_LOCALMSPID=Org%sMSP" % org_num,
                "CORE_PEER_ADDRESS=peer%s.org%s.example.com:7051" %
                (peer_num, org_num)],
            "ports": [
                "${PEER%s_ORG%s_GRPC_PORT}:7051" %
                (peer_num, org_num),
                "${PEER%s_ORG%s_EVENT_PORT}:7053" %
                (peer_num, org_num)],
            "volumes": [
                "/var/run/docker.sock:/var/run/docker.sock",
                "${COMPOSE_PROJECT_PATH}/%s" % msp_volumes,
                "${COMPOSE_PROJECT_PATH}/%s" % tls_volumes]
        }

    def _generate_orderer_config(self, image_version):
        external_links = []
        for org_num in range(self._org_count):
            org_num += 1
            peer_count = int(self._size / self._org_count)
            for peer_num in range(peer_count):
                external_links.append(
                    "${COMPOSE_PROJECT_NAME}_peer%s.org%s.example.com:"
                    "peer%s.org%s.example.com" %
                    (peer_num, org_num, peer_num, org_num)
                )
        return {
            "image": "hyperledger/fabric-orderer:%s" % image_version,
            "container_name": "${COMPOSE_PROJECT_NAME}_orderer",
            "restart": "always",
            "environment": [
                "ORDERER_GENERAL_LOGLEVEL=DEBUG",
                "ORDERER_GENERAL_LISTENADDRESS=0.0.0.0",
                "ORDERER_GENERAL_GENESISMETHOD=file",
                "ORDERER_GENERAL_GENESISFILE=/var/hyperledger/orderer/"
                "orderer.genesis.block",
                "ORDERER_GENERAL_LOCALMSPID=OrdererMSP",
                "ORDERER_GENERAL_LOCALMSPDIR=/var/hyperledger/orderer/msp",
                "ORDERER_GENERAL_TLS_ENABLED=true",
                "ORDERER_GENERAL_TLS_PRIVATEKEY=/var/hyperledger/orderer/"
                "tls/server.key",
                "ORDERER_GENERAL_TLS_CERTIFICATE=/var/hyperledger/orderer/"
                "tls/server.crt",
                "ORDERER_GENERAL_TLS_ROOTCAS=[/var/hyperledger/orderer/"
                "tls/ca.crt]"
            ],
            "volumes": [
                "${COMPOSE_PROJECT_PATH}/solo/channel-artifacts/"
                "orderer.genesis.block:/var/hyperledger/orderer/"
                "orderer.genesis.block",
                "${COMPOSE_PROJECT_PATH}/crypto-config/ordererOrganizations/"
                "example.com/orderers/orderer.example.com/msp:/"
                "var/hyperledger/orderer/msp",
                "${COMPOSE_PROJECT_PATH}/crypto-config/ordererOrganizations/"
                "example.com/orderers/orderer.example.com/tls/"
                ":/var/hyperledger/orderer/tls"
            ],
            "external_links": external_links,
            "command": "orderer",
            "ports": [
                "${ORDERER_PORT}:7050"
            ]
        }

    @staticmethod
    def _generate_ca_config(image_version, org_num, ca_name, key_file):
        return {
            "image": "hyperledger/fabric-ca:%s" % image_version,
            "container_name": "${COMPOSE_PROJECT_NAME}_ca_org%s" %
                              org_num,
            "environment": [
                "FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server",
                "FABRIC_CA_SERVER_CA_NAME=%s" % ca_name,
                "FABRIC_CA_SERVER_CA_CERTFILE=/etc/hyperledger/"
                "fabric-ca-server-config/"
                "ca.org%s.example.com-cert.pem" % org_num,
                "FABRIC_CA_SERVER_CA_KEYFILE="
                "/etc/hyperledger/fabric-ca-server-config/%s" % key_file,
                "FABRIC_CA_SERVER_TLS_ENABLED=true",
                "FABRIC_CA_SERVER_TLS_CERTFILE="
                "/etc/hyperledger/fabric-ca-server-config/"
                "ca.org%s.example.com-cert.pem" % org_num,
                "FABRIC_CA_SERVER_TLS_KEYFILE="
                "/etc/hyperledger/fabric-ca-server-config/%s" % key_file
            ],
            "ports": [
                "${CA_ORG%s_ECAP_PORT}:7054" % org_num
            ],
            "volumes": [
                "${COMPOSE_PROJECT_PATH}/crypto-config/"
                "peerOrganizations/org%s.example.com/ca/:/"
                "etc/hyperledger/fabric-ca-server-config" % org_num
            ],
            "command":
                "sh -c 'fabric-ca-server start -b admin:adminpw -d'"
        }

    def _generate_fabric_common(self, image_version="", ca_name_prefix=""):
        template = {
            "version": "3.2"
        }
        services = {}
        cert_files = CERT_FILES.get(self._network_type, [])
        for org_num in range(self._org_count):
            peer_count = int(self._size / self._org_count)
            org_num += 1
            ca_config_key = "ca.org%s.example.com" % org_num
            services.update({
                ca_config_key: self._generate_ca_config(
                    image_version, org_num, '%s%s' % (ca_name_prefix, org_num),
                    cert_files[org_num - 1])
            })
            for peer_num in range(peer_count):
                peer_config_key = "peer%s.org%s.example.com" % \
                                  (peer_num, org_num)
                peer_config = \
                    self._generate_peer_config(peer_num, org_num,
                                               image_version)
                services.update({
                    peer_config_key: peer_config
                })

        services["orderer.example.com"] = \
            self._generate_orderer_config(image_version)
        template["services"] = services

        return template

    def generate_compose_file(self):
        template = {}
        if self._network_type.startswith("fabric"):
            template = self._generate_fabric_common(
                IMAGE_VERSIONS.get(self._network_type),
                CA_NAME_PREFIX.get(self._network_type))

        with open(self._config_file, "w") as f:
            yaml.safe_dump(template, f, default_flow_style=False)
