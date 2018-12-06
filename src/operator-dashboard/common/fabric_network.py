# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import requests

from common.blockchain_network import BlockchainNetwork
from common.fabric_network_config import \
    FabricPreNetworkConfig, FabricV1NetworkConfig
from common import log_handler, LOG_LEVEL

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


class FabricNetwork(BlockchainNetwork):
    """
    FabricNetwork represents a general Hyperledger Fabric network.
    """

    def __init__(self, name, network_id, network_type):
        """

        Args:
            name: name of the network
            network_id: The id of the network
            network_type: The type of the network
        """
        self.name = name
        self.network_id = network_id
        self.network_type = network_type
        self.config = None

    def get_config(self):
        """
        Get the configuration data for the network
        Returns: configuration dict struct
        """
        return self.config


class FabricPreNetwork(FabricNetwork):
    """
    FabricPreNetwork represents a Hyperledger Fabric v0.6 network.
    """

    def __init__(self, name, network_id, network_type):
        super(FabricPreNetwork, self).__init__(name, network_id, network_type)

    def set_config(self, consensus_plugin, consensus_mode, size):
        self.config = FabricPreNetworkConfig(consensus_plugin, consensus_mode,
                                             size)


class FabricV1Network(FabricNetwork):
    """
    FabricV1Network represents a Hyperledger Fabric v1.0 network.
    """

    def __init__(self, name, network_id, network_type):
        """

        Args:
            name: name of the network
            network_id: The id of the network
            network_type: The type of the network
        """
        super(FabricV1Network, self).__init__(name, network_id, network_type)

    def set_config(self):
        self.config = FabricV1NetworkConfig()

# TODO: need re-implement this
    @classmethod
    def health_check(cls, cluster, cluster_id, timeout=5):
        """
        Check if the peer or cluster is healthy by checking its
        ports and number of containers running
        :param cluster: cluster to check
        :param cluster_id:
        :param timeout:
        :return: True or False
        """

        rest_api = cluster["worker_api"]
        if not rest_api.startswith("http"):
            segs = rest_api.split(":")  # tcp://x.x.x.x:2375
            if len(segs) != 3:
                rest_api = 'http://' + rest_api
                swarm_api = 'http://' + rest_api + '/swarm'
            else:
                rest_api = 'http:' + segs[1] + ':' + segs[2] + \
                    '/containers/json'
                swarm_api = 'http:' + segs[1] + ':' + segs[2] + \
                    '/swarm'
        logger.debug("rest_api = {}".format(rest_api))
        logger.debug("Swarm api = {}".format(swarm_api))
        try:
            r = requests.get(rest_api, timeout=timeout)
            logger.debug("Value got from rest_api: {}".format(r))
        except Exception as e:
            logger.error("Error to refresh health of cluster {}: {}"
                         .format(cluster_id, e))
            return True
        try:
            sr = requests.get(swarm_api, timeout=timeout)
        except Exception as e:
            logger.error("Error to refresh health of cluster {}: {}"
                         .format(cluster_id, e))
            return True
        if sr == '""message": "This node is not a swarm manager':
            logger.debug("This docker engine runs in SWARM mode")
            return False
        data = r.json()
        # name = list(map(lambda x: x.split('_'), d['Names'][0]))
        # logger.debug("Data got from rest_api: {}".format(data))
        peer_ports_up = 0
        orderer_up = 0
        containers = 0
        run_containers = 0
        for d in data:
            name = d['Names'][0].split('_')
            if name[1].startswith('peer'):
                ports = list(port['PrivatePort'] for port in d['Ports'])
                # logger.debug("peers from rest_api: {}".format(name[1]))
                # logger.debug("ports from rest_api: {}".
                #     format(ports))
                # logger.debug("Test1! {}".
                #     format(set(cluster['mapped_ports'].values())))
                # logger.debug("Test2! {}".format(set(ports)))
                if set(cluster['mapped_ports'].values()) == set(ports):
                    peer_ports_up += 1
                    logger.debug("Ports are up for container: {}- {}"
                                 .format(d['Names'][0], ports))
            if name[1].startswith('orderer'):
                orderer_up += 1
                logger.debug("Orderers: {}".format(d['Names'][0]))
            if d["State"] == "running":
                run_containers += 1
            containers += 1
            logger.debug("Number of Orderers up: {}".format(orderer_up))
        if (cluster["size"] == peer_ports_up and
                (run_containers == containers)):
            logger.debug("health check of cluster id={} is OK"
                         .format(cluster_id))
            return "OK"
        else:
            logger.debug("health check of cluster id={} FAIL"
                         .format(cluster_id))
            return False
