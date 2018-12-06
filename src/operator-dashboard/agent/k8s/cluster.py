# Copyright 2018 (c) VMware, Inc. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import logging
import os
import sys

from agent import K8sClusterOperation
from agent import KubernetesOperation

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import log_handler, LOG_LEVEL

from ..cluster_base import ClusterBase

from modules.models import Cluster as ClusterModel
from modules.models import Container, ServicePort

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


class ClusterOnKubernetes(ClusterBase):
    """ Main handler to operate the cluster in Kubernetes

    """
    def __init__(self):
        pass

    def _get_cluster_info(self, cid, config):
        cluster = ClusterModel.Query.get(id=cid)

        cluster_name = cluster.name
        kube_config = KubernetesOperation()._get_config_from_params(cluster
                                                                    .host
                                                                    .k8s_param)

        clusters_exists = ClusterModel.Query.\
            filter(host=cluster.host.as_pointer)
        clusters_exists = [cluster.as_pointer for cluster in clusters_exists]
        ports_index = [service.port for service in ServicePort
                       .Query.filter(cluster__in=clusters_exists)]

        nfsServer_ip = cluster.host.k8s_param.get('K8SNfsServer')
        consensus = config['consensus_plugin']

        return cluster, cluster_name, kube_config, ports_index, \
            nfsServer_ip, consensus

    def create(self, cid, mapped_ports, host, config, user_id):
        try:
            cluster, cluster_name, kube_config, ports_index, nfsServer_ip, \
                consensus = self._get_cluster_info(cid, config)

            operation = K8sClusterOperation(kube_config)
            cluster_name = self.trim_cluster_name(cluster_name)

            containers = operation.deploy_cluster(cluster_name,
                                                  ports_index,
                                                  nfsServer_ip,
                                                  consensus,
                                                  config.get('network_type'))
        except Exception as e:
            logger.error("Failed to create Kubernetes Cluster: {}".format(e))
            return None
        return containers

    def delete(self, cid, worker_api, config):
        try:
            cluster, cluster_name, kube_config, ports_index, nfsServer_ip,\
                consensus = self._get_cluster_info(cid, config)

            operation = K8sClusterOperation(kube_config)
            cluster_name = self.trim_cluster_name(cluster_name)
            operation.delete_cluster(cluster_name,
                                     ports_index,
                                     nfsServer_ip,
                                     consensus,
                                     config.get('network_type'))

            # delete ports for clusters
            cluster_ports = \
                ServicePort.Query.filter(cluster=cluster.as_pointer)
            if cluster_ports:
                for ports in cluster_ports:
                    ports.delete()
            cluster_containers = Container.Query.\
                filter(cluster=cluster.as_pointer)
            if cluster_containers:
                for container in cluster_containers:
                    container.delete()

        except Exception as e:
            logger.error("Failed to delete Kubernetes Cluster: {}".format(e))
            return False
        return True

    def get_services_urls(self, cid):
        try:
            cluster = ClusterModel.Query.get(id=cid)

            cluster_name = cluster.name
            kube_config = \
                KubernetesOperation()._get_config_from_params(cluster.host
                                                              .k8s_param)

            operation = K8sClusterOperation(kube_config)
            cluster_name = self.trim_cluster_name(cluster_name)
            services_urls = operation.get_services_urls(cluster_name)
        except Exception as e:
            logger.error("Failed to get Kubernetes services's urls: {}"
                         .format(e))
            return None
        return services_urls

    def start(self, name, worker_api, mapped_ports, log_type, log_level,
              log_server, config):
        try:
            cluster, cluster_name, kube_config, ports_index, nfsServer_ip, \
                consensus = self._get_cluster_info(name, config)

            operation = K8sClusterOperation(kube_config)
            cluster_name = self.trim_cluster_name(cluster_name)
            containers = operation.start_cluster(cluster_name, ports_index,
                                                 nfsServer_ip, consensus,
                                                 config.get('network_type'))

            if not containers:
                logger.warning("failed to start cluster={}, stop it again."
                               .format(cluster_name))
                operation.stop_cluster(cluster_name, ports_index,
                                       nfsServer_ip, consensus,
                                       config.get('network_type'))
                return None

            service_urls = self.get_services_urls(name)
            # Update the service port table in db
            for k, v in service_urls.items():
                service_port = ServicePort(name=k, ip=v.split(":")[0],
                                           port=int(v.split(":")[1]),
                                           cluster=cluster)
                service_port.save()
            for k, v in containers.items():
                container = Container(id=v, name=k, cluster=cluster)
                container.save()

        except Exception as e:
            logger.error("Failed to start Kubernetes Cluster: {}".format(e))
            return None
        return containers

    def stop(self, name, worker_api, mapped_ports, log_type, log_level,
             log_server, config):
        try:
            cluster, cluster_name, kube_config, ports_index, nfsServer_ip, \
                consensus = self._get_cluster_info(name, config)

            operation = K8sClusterOperation(kube_config)
            cluster_name = self.trim_cluster_name(cluster_name)
            operation.stop_cluster(cluster_name,
                                   ports_index,
                                   nfsServer_ip,
                                   consensus,
                                   config.get('network_type'))

            cluster_ports = \
                ServicePort.Query.filter(cluster=cluster.as_pointer)
            for ports in cluster_ports:
                ports.delete()
            cluster_containers = Container.Query.\
                filter(cluster=cluster.as_pointer)
            for container in cluster_containers:
                container.delete()

        except Exception as e:
            logger.error("Failed to stop Kubernetes Cluster: {}".format(e))
            return False
        return True

    def restart(self, name, worker_api, mapped_ports, log_type, log_level,
                log_server, config):
        result = self.stop(name, worker_api, mapped_ports, log_type, log_level,
                           log_server, config)
        if result:
            return self.start(name, worker_api, mapped_ports, log_type,
                              log_level, log_server, config)
        else:
            logger.error("Failed to Restart Kubernetes Cluster")
            return None

    def trim_cluster_name(self, cluster_name):
        if cluster_name.find("_") != -1:
            cluster_name = cluster_name.replace("_", "-")
        return cluster_name.lower()
