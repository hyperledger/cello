# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
from common.blockchain_network import BlockchainNetwork
from common.fabric_network_config import \
    FabricPreNetworkConfig, FabricV1NetworkConfig


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
