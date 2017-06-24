# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import abc


class BlockchainNetwork(object):
    """
    BlockchainNetwork is an abstract class to represent a general model of a
    blockchain, such as a Hyperledger Fabric network.
    """
    __metaclass__ = abc.ABCMeta

    @abc.abstractmethod
    def get_config(self):
        """
        Get the configuration data for the network
        Returns: configuration dict struct
        """
        return
