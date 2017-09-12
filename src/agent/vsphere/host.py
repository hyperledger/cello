# Copyright 2017 (c) VMware, Inc. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import datetime
import logging
import os
import sys


sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import \
    db, log_handler, \
    LOG_LEVEL

from ..host_base import HostBase


logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


class VsphereHost(HostBase):
    """ Main handler to operate the VMs in vSphere
    """
    def __init__(self):
        pass

    def create(self, worker_api):
        """ Create a new vSphere host node
        """

        return

    def delete(self, worker_api):
        """ Delete a host instance

        :param id: id of the host to delete
        :return:
        """
        return

    def reset(self, host_type, worker_api):
        """
        Clean a host's free clusters.

        :param id: host id
        :return: True or False
        """
        return


vsphere_host = VsphereHost()
