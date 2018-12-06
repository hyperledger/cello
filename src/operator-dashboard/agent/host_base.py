
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import abc


class HostBase(object):
    __metaclass__ = abc.ABCMeta

    @abc.abstractmethod
    def create(self, *args, **kwargs):
        """
        Create a new host
        Args:
            *args: args
            **kwargs: keyword args

        Returns:

        """
        return

    @abc.abstractmethod
    def delete(self, *args, **kwargs):
        return

    @abc.abstractmethod
    def reset(self, *args, **kwargs):
        return

    @abc.abstractmethod
    def is_active(self, *args):
        """
        Test if a host is active

        Args:
            *args: args

        Returns: Boolean

        """
        return

    @abc.abstractmethod
    def fillup(self, *args):
        """
        Fill up a host with blockchains

        Args:
            *args: args

        Returns: Boolean

        """
        return
