import datetime
import logging
import os
import sys


sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import \
    db, log_handler, \
    LOG_LEVEL

from ..host_base import HostBase

from agent import cleanup_host, check_daemon, detect_daemon_type, \
    reset_container_host, setup_container_host

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


def check_status(func):
    def wrapper(self, *arg):
        if not self.is_active(*arg):
            logger.warning("Host inactive")
            return False
        else:
            return func(self, *arg)
    return wrapper


class DockerHost(HostBase):
    """ Main handler to operate the Docker hosts
    """
    def __init__(self):
        self.col = db["host"]

    def create(self, daemon_url):
        """ Create a new docker host node

        A docker host is potentially a single node or a swarm.
        Will full fill with clusters of given capacity.

        :param name: name of the node
        :param daemon_url: daemon_url of the host
        :param capacity: The number of clusters to hold
        :param log_type: type of the log
        :param log_level: level of the log
        :param log_server: server addr of the syslog
        :param autofill: Whether automatically fillup with chains
        :param schedulable: Whether can schedule cluster request to it
        :param serialization: whether to get serialized result or object
        :return: True or False
        """

        if check_daemon(daemon_url):
            logger.warning("The daemon_url is active:" + daemon_url)
        else:
            logger.warning("The daemon_url is inactive:" + daemon_url)
            return False

        detected_type = detect_daemon_type(daemon_url)

        if detected_type not in ['docker', 'swarm']:
            logger.warning("Detected type={} is not docker or swarm".
                           format(detected_type))
            return False

        if setup_container_host(detected_type, daemon_url):
            return True
        else:
            logger.warning("Cannot setup Docker host daemon_url={}"
                           .format(daemon_url))
            return False

    def delete(self, daemon_url):
        """ Delete a host instance

        :param id: id of the host to delete
        :return:
        """

        cleanup_host(daemon_url)
        return True

    @check_status
    def reset(self, host_type, daemon_url):
        """
        Clean a host's free clusters.

        :param id: host id
        :return: True or False
        """
        return reset_container_host(host_type=host_type,
                                    daemon_url=daemon_url)

    def refresh_status(self, daemon_url):
        """
        Refresh the status of the host by detection

        :param host: the host to update status
        :return: Updated host
        """
        return check_daemon(daemon_url)


docker_host = DockerHost()
