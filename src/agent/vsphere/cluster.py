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
        containers = compose_up(name=cid, mapped_ports=mapped_ports,
                                host=host, config=config)

        if not containers:
            return []

        return containers

    def delete(self, id, worker_api, config):
        return compose_clean(id, worker_api, config)

    def start(self, name, worker_api, mapped_ports, log_type, log_level,
              log_server, config):
        return compose_start(name, worker_api, mapped_ports, log_type,
                             log_level, log_server, config)

    def restart(self, name, worker_api, mapped_ports, log_type, log_level,
                log_server, config):
        return compose_restart(name, worker_api, mapped_ports, log_type,
                               log_level, log_server, config)

    def stop(self, name, worker_api, mapped_ports, log_type, log_level,
             log_server, config):
        return compose_stop(name, worker_api, mapped_ports, log_type,
                            log_level, log_server, config)


cluster_on_vsphere = ClusterOnVsphere()
