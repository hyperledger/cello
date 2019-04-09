#
# SPDX-License-Identifier: Apache-2.0
#
import abc


class NetworkBase(object):
    __metaclass__ = abc.ABCMeta

    def __init__(self, *args, **kwargs):
        pass

    @abc.abstractmethod
    def generate_config(self, *args, **kwargs):
        pass
