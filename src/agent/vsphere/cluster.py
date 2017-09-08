# Copyright 2017 (c) VMware, Inc. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import logging
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import log_handler, LOG_LEVEL

from agent import compose_up, compose_clean, compose_start, compose_stop, \
    compose_restart

from common import NETWORK_TYPES, CONSENSUS_PLUGINS_FABRIC_V1, \
    CONSENSUS_MODES, NETWORK_SIZE_FABRIC_PRE_V1

from ..cluster_base import ClusterBase


logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


class ClusterOnVsphere(ClusterBase):
    """ Main handler to operate the cluster in pool

    """
    def __init__(self):
        pass

    def create(self, cid, mapped_ports, host, config, user_id=""):
        """ Create a cluster based on given data. This will first select the VM
        then call compose_up
        """
        return

    def delete(self, id, worker_api, config):
        """ Delete a fabric cluster.
        """
        return

    def start(self, name, worker_api, mapped_ports, log_type, log_level,
              log_server, config):
        """ Star a fabric cluster
        need to identify the right vm and run compose_start on that vm
        """
        return

    def restart(self, name, worker_api, mapped_ports, log_type, log_level,
                log_server, config):
        """ Restart a fabric cluster. Need to identify which VM this cluster lives on
        and then call compose_restart
        """
        return

    def stop(self, name, worker_api, mapped_ports, log_type, log_level,
             log_server, config):
        """ Stop a Fabric cluster. First identify the VM then call compose_stop.
        """
        return


cluster_on_vsphere = ClusterOnVsphere()
