class BlockchainNetworkConfig(object):
    """
    BlockchainNetworkConfig includes those configuration data for a network.
    """

    def __init__(self, data=None, metadata=None):
        """
        Init.

        Args:
            data: config data related to network.
            metadata: metadata is for cello usage.
        """
        self.data = data or {}  # include all config data we need for a network
        self.metadata = metadata or {}  # metadata is for cello usage

    def get_data(self):
        """
        Get the configuration data for the blockchain network
        Returns: data dict
        """
        return self.data

    def get_metadata(self):
        """
        Get the metadata
        Returns: metadata dict
        """
        return self.metadata
