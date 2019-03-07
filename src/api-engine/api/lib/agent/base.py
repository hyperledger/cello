#
# SPDX-License-Identifier: Apache-2.0
#
import abc


class AgentBase(object):
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
        pass

    @abc.abstractmethod
    def delete(self, *args, **kwargs):
        pass

    @abc.abstractmethod
    def start(self, *args, **kwargs):
        pass

    @abc.abstractmethod
    def stop(self, *args, **kwargs):
        pass
