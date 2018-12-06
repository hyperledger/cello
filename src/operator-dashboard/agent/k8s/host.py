# Copyright 2018 (c) VMware, Inc. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

import logging

from ..host_base import HostBase
from agent import KubernetesOperation
from common import log_handler, LOG_LEVEL, db, utils

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


class KubernetesHost(HostBase):
    """ Main handler to operate the K8s hosts
    """
    def __init__(self):
        self.operation = KubernetesOperation()

    def create(self, k8s_params):
        """ Create a new Kubernetes host
        :param k8s_params : params to connect to Kubernetes Master node
        :return:
        """
        # Init connection
        return self.operation.check_host(k8s_params)

    def refresh_status(self, k8s_params):
        """ Refresh the status of the host
        :param k8s_params: params to connect to Kubernetes Master node
        :return: the status of the host
        """
        return self.operation.refresh_status(k8s_params)

    def delete(self, k8s_params):
        """ Delete a host instance and the cluster on it
        :param k8s_params: params to connect to Kubernetes Master node
        :return:
        """
        pass

    def reset(self, k8s_params):
        """ Clean the free clusters on the host.
        :param k8s_params: params to connect to Kubernetes Master node
        :return:
        """
        pass
