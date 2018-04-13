# Copyright 2018 (c) VMware, Inc. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import logging
import os
import sys

from agent import K8sClusterOperation

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


class ClusterOnKubernetes(ClusterBase):
    """ Main handler to operate the cluster in Kubernetes

    """
    def __init__(self):
        pass

    def create(self, kube_config, cluster_name, ports_index, nfsServer_ip):
        try:
            operation = K8sClusterOperation(kube_config)
            containers = operation.deploy_cluster(cluster_name,
                                                  ports_index,
                                                  nfsServer_ip)
        except Exception as e:
            logger.error("Failed to create Kubernetes Cluster: {}".format(e))
            return None
        return containers

    def delete(self, kube_config, cluster_name, ports_index, nfsServer_ip):
        try:
            operation = K8sClusterOperation(kube_config)
            operation.delete_cluster(cluster_name, ports_index, nfsServer_ip)
        except Exception as e:
            logger.error("Failed to delete Kubernetes Cluster: {}".format(e))
            return False
        return True

    def get_services_urls(self, kube_config, cluster_name):
        try:
            operation = K8sClusterOperation(kube_config)
            services_urls = operation.get_services_urls(cluster_name)
        except Exception as e:
            logger.error("Failed to get Kubernetes services's urls: {}"
                         .format(e))
            return None
        return services_urls

    def start(self, kube_config, cluster_name, ports_index, nfsServer_ip):
        try:
            operation = K8sClusterOperation(kube_config)
            containers = operation.start_cluster(cluster_name, ports_index,
                                                 nfsServer_ip)
        except Exception as e:
            logger.error("Failed to start Kubernetes Cluster: {}".format(e))
            return None
        return containers

    def stop(self, kube_config, cluster_name, ports_index, nfsServer_ip):
        try:
            operation = K8sClusterOperation(kube_config)
            operation.stop_cluster(cluster_name, ports_index, nfsServer_ip)
        except Exception as e:
            logger.error("Failed to stop Kubernetes Cluster: {}".format(e))
            return False
        return True

    def restart(self, kube_config, cluster_name, ports_index, nfsServer_ip):
        result = self.stop(kube_config, cluster_name, ports_index,
                           nfsServer_ip)
        if result:
            return self.start(kube_config, cluster_name, ports_index,
                              nfsServer_ip)
        else:
            logger.error("Failed to Restart Kubernetes Cluster")
            return None
