from common.blockchain_network_config import BlockchainNetworkConfig
from common.utils import NETWORK_TYPES


class FabricNetworkConfig(BlockchainNetworkConfig):
    """
    FabricNetworkConfig includes those configuration data for a fabric network.
    """

    def __init__(self, data=None, metadata=None):
        """
        Init.

        Args:
            data: config data related to the fabric network.
            metadata: metadata is for cello usage.
        """
        if not data:
            data = {  # will be used in compose template as the network config
                'for_test': NETWORK_TYPES[0]
            }

        if not metadata:
            metadata = {  # for cello usage
                'name': 'FABRIC_NETWORK_{}'.format('test'),  # TODO: randomlize
                'type': NETWORK_TYPES[0],  # network of the blockchain
                'worker_api': '',  # which worker will handle this network
                'envs': {}  # env variables to setup, before sending request
                # to worker. Can be used for compose template files
            }
        super(FabricNetworkConfig, self).__init__(data, metadata)

    def get_data(self):
        """
        Get the configuration data
        Returns: data dict
        """
        return self.data

    def get_metadata(self):
        """
        Get the metadata
        Returns: metadata dict
        """
        return self.metadata
