# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import logging

from common.blockchain_network_config import BlockchainNetworkConfig

from common import CONSENSUS_PLUGINS_FABRIC_V1, CONSENSUS_MODES, \
    NETWORK_TYPE_FABRIC_PRE_V1, NETWORK_TYPE_FABRIC_V1, \
    NETWORK_SIZE_FABRIC_PRE_V1, NETWORK_SIZE_FABRIC_V1, \
    log_handler, LOG_LEVEL

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


# TODO: deprecated soon
class FabricPreNetworkConfig(BlockchainNetworkConfig):
    """
    FabricPreNetworkConfig includes configs for fabric v0.6 network.
    """

    def __init__(self, consensus_plugin, consensus_mode, size):
        """
        Init.

        Args:
            consensus_plugin: consensus plugin to use, e.g., pbft
            consensus_mode: consensus mode, e.g., sieve
            size: size of nodes in the network

        >>> config = FabricPreNetworkConfig('plugin', 'mode', 'size')
        """
        self.network_type = NETWORK_TYPE_FABRIC_PRE_V1
        self.consensus_plugin = consensus_plugin
        self.consensus_mode = consensus_mode
        self.size = size
        super(FabricPreNetworkConfig, self).__init__()

    def validate(self):
        """
        Validate whether the config is valid

        Returns: Boolean
        """
        if self.consensus_plugin not in CONSENSUS_PLUGINS_FABRIC_V1:
            error_msg = "Unknown consensus plugin={}".format(
                self.consensus_plugin)
            logger.debug(error_msg)
            return False

        if self.consensus_plugin != CONSENSUS_PLUGINS_FABRIC_V1[0] \
           and self.consensus_plugin != CONSENSUS_PLUGINS_FABRIC_V1[2] \
           and self.consensus_mode not in CONSENSUS_MODES:
            logger.debug("Invalid consensus, plugin={}, mode={}".format(
                self.consensus_plugin, self.consensus_mode))
            return False

        if self.size not in NETWORK_SIZE_FABRIC_PRE_V1:
            error_msg = "Unknown cluster size={}".format(self.size)
            logger.debug(error_msg)
        return True


class FabricV1NetworkConfig(BlockchainNetworkConfig):
    """
    FabricV1NetworkConfig includes configs for fabric v1.0 network.
    """

    def __init__(self, consensus_plugin=CONSENSUS_MODES[0], size=4):
        """
        Init.

        Args:
            consensus_plugin: plugin of consensus, e.g., solo, kafka
            size: number of containers in the network
        """
        self.network_type = NETWORK_TYPE_FABRIC_V1
        self.consensus_plugin = consensus_plugin
        self.size = size
        super(FabricV1NetworkConfig, self).__init__()

    def validate(self):
        """
        Validate whether the config is valid

        Returns: Boolean
        """

        return self.consensus_plugin in CONSENSUS_PLUGINS_FABRIC_V1 and \
            self.size in NETWORK_SIZE_FABRIC_V1


if __name__ == "__main__":
    import doctest
    doctest.testmod()
