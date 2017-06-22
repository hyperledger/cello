
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import abc


class ClusterBase(object):
    __metaclass__ = abc.ABCMeta

    @abc.abstractmethod
    def create(self, *args, **kwargs):
        """
        Create a new cluster
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
    def start(self, *args, **kwargs):
        return

    @abc.abstractmethod
    def stop(self, *args, **kwargs):
        return
