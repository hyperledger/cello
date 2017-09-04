
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
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
    def __init__(self, host_type):
        self.col = db["host"]
        self.host_type = host_type

    def create(self, worker_api):
        """ Create a new docker host node

        A docker host is potentially a single node or a swarm.
        Will full fill with clusters of given capacity.

        :param name: name of the node
        :param worker_api: worker_api of the host
        :param capacity: The number of clusters to hold
        :param log_type: type of the log
        :param log_level: level of the log
        :param log_server: server addr of the syslog
        :param autofill: Whether automatically fillup with chains
        :param schedulable: Whether can schedule cluster request to it
        :param serialization: whether to get serialized result or object
        :return: True or False
        """

        if check_daemon(worker_api):
            logger.warning("The worker_api is active:" + worker_api)
        else:
            logger.warning("The worker_api is inactive:" + worker_api)
            return False

        detected_type = detect_daemon_type(worker_api)
        if detected_type != self.host_type:
            logger.warning("Host type={} should be same with the initialized \
                            type={}".format(detected_type, self.host_type))
            return False

        if detected_type not in ['docker', 'swarm']:
            logger.warning("Detected type={} is not docker or swarm".
                           format(detected_type))
            return False

        if setup_container_host(detected_type, worker_api):
            return True
        else:
            logger.warning("Cannot setup Docker host worker_api={}"
                           .format(worker_api))
            return False

    def delete(self, worker_api):
        """ Delete a host instance

        :param id: id of the host to delete
        :return:
        """

        cleanup_host(worker_api)
        return True

    @check_status
    def reset(self, host_type, worker_api):
        """
        Clean a host's free clusters.

        :param id: host id
        :return: True or False
        """
        return reset_container_host(host_type=host_type,
                                    worker_api=worker_api)

    def refresh_status(self, worker_api):
        """
        Refresh the status of the host by detection

        :param host: the host to update status
        :return: Updated host
        """
        return check_daemon(worker_api)
