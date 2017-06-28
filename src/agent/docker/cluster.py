
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import log_handler, LOG_LEVEL

from agent import compose_up, compose_clean, compose_start, compose_stop, \
    compose_restart

from common import NETWORK_TYPES, CONSENSUS_PLUGINS, \
    CONSENSUS_MODES, NETWORK_SIZE_FABRIC_PRE_V1

from ..cluster_base import ClusterBase


logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


class ClusterOnDocker(ClusterBase):
    """ Main handler to operate the cluster in pool

    """
    def __init__(self):
        pass

    def create(self, cid, mapped_ports, host, user_id="",
               network_type=NETWORK_TYPES[0],
               config=None):
        """ Create a cluster based on given data

        TODO: maybe need other id generation mechanism

        :param name: name of the cluster
        :param host_id: id of the host URL
        :param start_port: first service port for cluster, will generate
         if not given
        :param user_id: user_id of the cluster if start to be applied
        :param network_type: fabric images version
        :param config: network config

        :return: Id of the created cluster or None
        """

        # from now on, we should be safe

        # start compose project, failed then clean and return
        logger.debug("Start compose project with name={}".format(cid))
        containers = compose_up(name=cid, mapped_ports=mapped_ports, host=host,
                                network_type=network_type, config=config)
        if not containers or len(containers) != config.size:
            logger.warning("failed to create cluster, with container={}"
                           .format(containers))
            return []
        else:
            return containers

    def delete(self, id, worker_api, network_type, config):
        return compose_clean(id, worker_api, network_type, config)

    def start(self, name, worker_api, mapped_ports, network_type,
              log_type, log_level, log_server, config):
        return compose_start(name, worker_api, mapped_ports, network_type,
                             log_type, log_level, log_server, config)

    def restart(self, name, worker_api, mapped_ports, network_type,
                log_type, log_level, log_server, config):
        return compose_restart(name, worker_api, mapped_ports, network_type,
                               log_type, log_level, log_server, config)

    def stop(self, name, worker_api, mapped_ports, network_type,
             log_type, log_level, log_server, config):
        return compose_stop(name, worker_api, mapped_ports, network_type,
                            log_type, log_level, log_server, config)


cluster_on_docker = ClusterOnDocker()
