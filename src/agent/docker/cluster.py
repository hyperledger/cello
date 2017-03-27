import logging
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import log_handler, LOG_LEVEL

from agent import compose_up, compose_clean, compose_start, compose_stop, \
    compose_restart

from common import CONSENSUS_PLUGINS, \
    CONSENSUS_MODES, CLUSTER_SIZES

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
               consensus_plugin=CONSENSUS_PLUGINS[0],
               consensus_mode=CONSENSUS_MODES[0], size=CLUSTER_SIZES[0]):
        """ Create a cluster based on given data

        TODO: maybe need other id generation mechanism

        :param name: name of the cluster
        :param host_id: id of the host URL
        :param start_port: first service port for cluster, will generate
         if not given
        :param user_id: user_id of the cluster if start to be applied
        :param consensus_plugin: type of the consensus type
        :param size: size of the cluster, int type
        :return: Id of the created cluster or None
        """

        # from now on, we should be safe

        # start compose project, failed then clean and return
        logger.debug("Start compose project with name={}".format(cid))
        containers = compose_up(
            name=cid, mapped_ports=mapped_ports, host=host,
            consensus_plugin=consensus_plugin, consensus_mode=consensus_mode,
            cluster_size=size)
        if not containers or len(containers) != size:
            logger.warning("failed to create cluster, with container={}"
                           .format(containers))
            return []
        else:
            return containers

    def delete(self, id, daemon_url, consensus_plugin):
        return compose_clean(id, daemon_url, consensus_plugin)

    def start(self, name, daemon_url, mapped_ports, consensus_plugin,
              consensus_mode, log_type, log_level, log_server, cluster_size):
        return compose_start(name, daemon_url, mapped_ports, consensus_plugin,
                             consensus_mode, log_type, log_level, log_server,
                             cluster_size)

    def restart(self, name, daemon_url, mapped_ports, consensus_plugin,
                consensus_mode, log_type, log_level, log_server, cluster_size):
        return compose_restart(name, daemon_url, mapped_ports,
                               consensus_plugin, consensus_mode, log_type,
                               log_level, log_server, cluster_size)

    def stop(self, name, daemon_url, mapped_ports, consensus_plugin,
             consensus_mode, log_type, log_level, log_server, cluster_size):
        return compose_stop(name, daemon_url, mapped_ports, consensus_plugin,
                            consensus_mode, log_type, log_level, log_server,
                            cluster_size)


cluster_on_docker = ClusterOnDocker()
