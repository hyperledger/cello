from common.blockchain_network import BlockchainNetwork
from common.fabric_network_config import FabricNetworkConfig


class FabricNetwork(BlockchainNetwork):
    """
    FabricNetwork represents a Hyperledger Fabric network.
    """

    def __init__(self, config=None):
        """

        Args:
            config: configuration data of the fabric network
        """
        self.config = config or FabricNetworkConfig()

    def get_config(self):
        """
        Get the configuration data for the network
        Returns: configuration dict struct
        """
        return self.config
