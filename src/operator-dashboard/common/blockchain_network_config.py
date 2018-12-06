# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#


class BlockchainNetworkConfig(dict):
    """
    BlockchainNetworkConfig includes those configuration data for a network.
    """

    def __init__(self):
        """
        Init.

        Args:
            None

        >>> config = BlockchainNetworkConfig()
        >>> config.get_data()
        {}
        >>> config['key'] = 'value'
        >>> config['key']
        'value'
        >>> config.key
        'value'
        >>> config.get_data()
        {'key': 'value'}
        """
        super(BlockchainNetworkConfig, self).__init__()

    def __getattr__(self, name):
        try:
            return self[name]
        except KeyError as e:
            raise AttributeError(e)

    def __setattr__(self, name, value):
        self[name] = value

    def get_data(self):
        """
        Get the configuration data for the blockchain network
        Returns: data dict
        """
        return dict(self)


if __name__ == "__main__":
    import doctest
    doctest.testmod()
