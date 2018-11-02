
# Copyright 2018 (c) VMware, Inc. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
#

import logging
import copy
import json
import os
import sys
import shutil
import time
import yaml

from ..host_base import HostBase
from common import log_handler, LOG_LEVEL, db, utils, \
    NETWORK_TYPE_FABRIC_V1, NETWORK_TYPE_FABRIC_V1_1, \
    NETWORK_TYPE_FABRIC_V1_2
from jinja2 import Template, Environment, FileSystemLoader
from kubernetes import client, config
from kubernetes.stream import stream

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


class K8sClusterOperation():
    """
    Object to operate cluster on kubernetes
    """
    def __init__(self, kube_config):
        client.Configuration.set_default(kube_config)
        self.extendv1client = client.ExtensionsV1beta1Api()
        self.corev1client = client.CoreV1Api()
        self.support_namespace = ['Deployment', 'Service',
                                  'PersistentVolumeClaim']
        self.create_func_dict = {
            "Deployment": self._create_deployment,
            "Service": self._create_service,
            "PersistentVolume": self._create_persistent_volume,
            "PersistentVolumeClaim": self._create_persistent_volume_claim,
            "Namespace": self._create_namespace
        }
        self.delete_func_dict = {
            "Deployment": self._delete_deployment,
            "Service": self._delete_service,
            "PersistentVolume": self._delete_persistent_volume,
            "PersistentVolumeClaim": self._delete_persistent_volume_claim,
            "Namespace": self._delete_namespace
        }

    def _upload_config_file(self, cluster_name, consensus, network_type):
        try:
            cluster_path = os.path.join('/cello', cluster_name)
            # Uploading the 'resources' directory with its content in the
            # '/cello remote directory
            current_path = os.path.dirname(__file__)

            # Only solo and kafka supported
            if consensus == "solo":
                resources_path = os.path.join(current_path,
                                              "cluster_resources",
                                              network_type)
            else:
                resources_path = os.path.join(current_path,
                                              "cluster_resources_kafka",
                                              network_type)

            shutil.copytree(resources_path, cluster_path)
        except Exception as e:
            error_msg = (
                "Failded to upload cluster files to NFS Server due "
                "to incorrect parameters."
            )
            logger.error("Creating Kubernetes cluster error msg: {}".format(e))
            raise Exception(error_msg)

    def _delete_config_file(self, cluster_name):
        try:
            cluster_path = os.path.join('/cello', cluster_name)
            shutil.rmtree(cluster_path)
        except Exception as e:
            error_msg = (
                "Failded to delete cluster files in NFS Server due "
                "to incorrect parameters."
            )
            logger.error("Creating Kubernetes cluster error msg: {}".format(e))
            raise Exception(error_msg)

    def _render_config_file(self, file_name, cluster_name,
                            cluster_ports, nfsServer_ip, network_type):
        # images_version = self._version_network_images(network_type)
        # if images_version is None:
        #     raise Exception("the network_type: {} is not supported".
        #                     format(network_type))

        # get template file's ports
        externalPort, chaincodePort, nodePort = "", "", ""
        if ("pvc" not in file_name and "namespace" not in file_name and
           "cli" not in file_name):
            if "peer" in file_name:
                externalPort = cluster_ports[file_name].get("externalPort")
                chaincodePort = cluster_ports[file_name].get("chaincodePort")
                nodePort = cluster_ports[file_name].get("nodePort")
            else:
                nodePort = cluster_ports[file_name]
        current_path = os.path.dirname(__file__)
        templates_path = os.path.join(current_path, "templates", network_type)
        env = Environment(
            loader=FileSystemLoader(templates_path),
            trim_blocks=True,
            lstrip_blocks=True
        )
        template = env.get_template(file_name)
        output = template.render(clusterName=cluster_name,
                                 externalPort=externalPort,
                                 chaincodePort=chaincodePort,
                                 nodePort=nodePort,
                                 nfsServer=nfsServer_ip,)
        return output

    def _pod_exec_command(self, pod_name, namespace, command):
        try:
            bash_command = ['/bin/bash', '-c', command]
            resp = stream(self.corev1client.connect_get_namespaced_pod_exec,
                          pod_name, namespace, command=bash_command,
                          stdout=True)

            logger.debug(resp)
        except client.rest.ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _filter_cli_pod_name(self, namespace):
        ret = self.corev1client.list_pod_for_all_namespaces(watch=False)
        pod_list = []
        for i in ret.items:
            if (i.metadata.namespace == namespace and
               i.metadata.name.startswith("cli")):
                pod_list.append(i.metadata.name)
        return pod_list

    def _is_cluster_pods_running(self, namespace):
        ret = self.corev1client.list_pod_for_all_namespaces(watch=False)
        for i in ret.items:
            if i.metadata.namespace == namespace:
                if not i.status.phase == "Running":
                    return False
        return True

    def _get_cluster_pods(self, namespace):
        ret = self.corev1client.list_pod_for_all_namespaces(watch=False)
        pod_list = {}
        for i in ret.items:
            if i.metadata.namespace == namespace:
                pod_list[i.metadata.name] = i.metadata.uid

        return pod_list

    def _get_node_ip(self, node_name):
        ret = self.corev1client.list_node()
        ip = ""
        for i in ret.items:
            for addr in i.status.addresses:
                if addr.type == "ExternalIP":
                    ip = addr.address
                elif addr.type == "InternalIP":
                    ip = addr.address
                else:
                    continue
        return ip

    def _get_node_ip_of_service(self, service_name):
        ret = self.corev1client.list_pod_for_all_namespaces(watch=False)

        for i in ret.items:
            if i.metadata.name.startswith(service_name):
                return self._get_node_ip(i.spec.node_name)

    def _get_service_external_port(self, namespace, ip):
        ret = self.corev1client.list_service_for_all_namespaces(watch=False)
        results = {}
        # result template
        r_template = ip + ":" + "{}"
        for i in ret.items:
            if i.metadata.namespace == namespace:
                tmp_name = i.metadata.name.replace("-", "_")
                if i.metadata.name.startswith("peer"):
                    for port in i.spec.ports:
                        # transfer port name which can be recognized.
                        if port.name == "externale-listen-endpoint":
                            external_port = port.node_port
                            name = tmp_name + "_grpc"
                            value = r_template.format(external_port)

                        elif port.name == "listen":
                            event_port = port.node_port
                            name = tmp_name + "_event"
                            value = r_template.format(event_port)

                        else:
                            continue

                        results[name] = value

                elif i.metadata.name.startswith("ca"):
                    name = tmp_name + "_ecap"
                    for port in i.spec.ports:
                        _port = port.node_port
                        value = r_template.format(_port)
                        results[name] = value

                elif i.metadata.name.startswith("orderer"):
                    name = "orderer"
                    for port in i.spec.ports:
                        _port = port.node_port
                        value = r_template.format(_port)
                        results[name] = value

                else:
                    continue

        return results

    def _create_deployment(self, namespace, data, **kwargs):
        try:
            resp = self.extendv1client.create_namespaced_deployment(namespace,
                                                                    data,
                                                                    **kwargs)
            logger.debug(resp)
        except client.rest.ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _create_service(self, namespace, data, **kwargs):
        try:
            resp = self.corev1client.create_namespaced_service(namespace,
                                                               data,
                                                               **kwargs)
            logger.debug(resp)
        except client.rest.ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _create_persistent_volume_claim(self, namespace, data, **kwargs):
        try:
            resp = self.corev1client.\
                create_namespaced_persistent_volume_claim(namespace,
                                                          data,
                                                          **kwargs)
            logger.debug(resp)
        except client.rest.ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _create_persistent_volume(self, data, **kwargs):
        try:
            resp = self.corev1client.create_persistent_volume(data, **kwargs)
            logger.debug(resp)
        except client.rest.ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _create_namespace(self, data, **kwargs):
        try:
            resp = self.corev1client.create_namespace(data, **kwargs)
            logger.debug(resp)
        except client.rest.ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _delete_persistent_volume_claim(self, name, namespace, data, **kwargs):
        try:
            resp = self.corev1client.\
                delete_namespaced_persistent_volume_claim(name, namespace,
                                                          data, **kwargs)
            logger.debug(resp)
        except client.rest.ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _delete_persistent_volume(self, name, data, **kwargs):
        try:
            resp = self.corev1client.delete_persistent_volume(name, data,
                                                              **kwargs)
            logger.debug(resp)
        except client.rest.ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _delete_service(self, name, namespace, data, **kwargs):
        try:
            # delete_namespaced_service does not need data actually.
            resp = self.corev1client.delete_namespaced_service(name,
                                                               namespace,
                                                               **kwargs)
            logger.debug(resp)
        except client.rest.ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _delete_namespace(self, name, data, **kwargs):
        try:
            resp = self.corev1client.delete_namespace(name, data, **kwargs)
            logger.debug(resp)
        except client.rest.ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _delete_deployment(self, name, namespace, data, **kwargs):
        try:
            resp = self.extendv1client.\
                delete_namespaced_deployment(name, namespace,
                                             data, **kwargs)
            logger.debug(resp)
        except client.rest.ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _deploy_k8s_resource(self, yaml_data):
        for data in yaml_data:
            if data is None:
                continue
            kind = data.get('kind', None)
            name = data.get('metadata').get('name', None)
            namespace = data.get('metadata').get('namespace', None)

            logs = "Deploy namespace={}, name={}, kind={}".format(namespace,
                                                                  name,
                                                                  kind)
            logger.info(logs)

            if kind in self.support_namespace:
                self.create_func_dict.get(kind)(namespace, data)
            else:
                self.create_func_dict.get(kind)(data)
            time.sleep(3)

    def _delete_k8s_resource(self, yaml_data):
        for data in yaml_data:
            if data is None:
                continue
            kind = data.get('kind', None)
            name = data.get('metadata').get('name', None)
            namespace = data.get('metadata').get('namespace', None)

            delete_data = client.V1DeleteOptions()

            logs = "Delete namespace={}, name={}, kind={}".format(namespace,
                                                                  name,
                                                                  kind)
            logger.info(logs)

            if kind in self.support_namespace:
                self.delete_func_dict.get(kind)(name, namespace, delete_data)
            else:
                self.delete_func_dict.get(kind)(name, delete_data)
            time.sleep(3)

    def _setup_cluster(self, cluster_name):
        pod_commands_1 = ["peer channel create -c mychannel -o \
                          orderer0:7050 --tls --cafile $ORDERER_CA \
                          -f resources/channel-artifacts/mychannel.tx",
                          "cp ./mychannel.block \
                          ./resources/channel-artifacts -rf",
                          "env CORE_PEER_ADDRESS=peer0-org1:7051 \
                          peer channel join -b \
                          resources/channel-artifacts/mychannel.block",
                          "env CORE_PEER_ADDRESS=peer1-org1:7051 \
                          peer channel join -b \
                          resources/channel-artifacts/mychannel.block",
                          "peer channel update -c mychannel -o \
                          orderer0:7050 --tls --cafile $ORDERER_CA \
                          -f resources/channel-artifacts/Org1MSPanchors.tx"
                          ]

        pod_commands_2 = ["env CORE_PEER_ADDRESS=peer0-org2:7051 \
                          peer channel join -b \
                          resources/channel-artifacts/mychannel.block",
                          "env CORE_PEER_ADDRESS=peer1-org2:7051 \
                          peer channel join -b \
                          resources/channel-artifacts/mychannel.block",
                          "peer channel update -c mychannel -o \
                          orderer0:7050 --tls --cafile $ORDERER_CA \
                          -f resources/channel-artifacts/Org2MSPanchors.tx"]

        pod_list = self._filter_cli_pod_name(cluster_name)
        if len(pod_list) == 2:
            for pod in pod_list:
                if "org1" in pod:
                    for cmd in pod_commands_1:
                        time.sleep(10)
                        self._pod_exec_command(pod, cluster_name, cmd)

                elif "org2" in pod:
                    for cmd in pod_commands_2:
                        time.sleep(10)
                        self._pod_exec_command(pod, cluster_name, cmd)
                else:
                    logger.info("Unknown cli pod: {}  was found".format(pod))
        else:
            e = ("Cannot not find Kubernetes cli pods.")
            logger.error("Kubernetes cluster creation error msg: {}".format(e))
            raise Exception(e)

    def get_services_urls(self, cluster_name):
        ret = self.corev1client.list_service_for_all_namespaces(watch=False)
        service = ""
        for i in ret.items:
            if i.metadata.namespace == cluster_name:
                service = i.metadata.name
                break

        service_ip = self._get_node_ip_of_service(service)
        service_urls = self._get_service_external_port(cluster_name,
                                                       service_ip)
        return service_urls

    def _get_cluster_ports(self, ports_index):
        logger.debug("Current exsiting cluster ports= {}".format(ports_index))
        if ports_index:
            current_port = int(max(ports_index)) + 10
        else:
            current_port = 30500
        cluster_ports = {}
        current_path = os.path.dirname(__file__)
        templates_path = os.path.join(current_path, "templates")
        for (dir_path, dir_name, file_list) in os.walk(templates_path):
            for f in file_list:
                # pvc and namespace fs do not have port mapping
                if ("pvc" not in f and "namespace" not in f and
                   "cli" not in f):
                    if "peer" in f:
                        peers_ports = {}
                        peers_ports["externalPort"] = str(current_port)
                        peers_ports["chaincodePort"] = str(current_port + 1)
                        peers_ports["nodePort"] = str(current_port + 2)
                        current_port = current_port + 3
                        cluster_ports[f] = peers_ports
                    else:
                        cluster_ports[f] = str(current_port)
                        current_port = current_port + 1
        logger.debug("return generated cluster ports= {}"
                     .format(cluster_ports))
        return cluster_ports

    # transfer the network type to images version
    def _version_network_images(self, network_version):
        network_images = {NETWORK_TYPE_FABRIC_V1: '1.0.5',
                          NETWORK_TYPE_FABRIC_V1_1: '1.1.0',
                          NETWORK_TYPE_FABRIC_V1_2: '1.2.0'}

        return network_images.get(network_version, None)

    def _deploy_cluster_resource(self, cluster_name,
                                 cluster_ports, nfsServer_ip,
                                 consensus, network_type):
        # create namespace in advance
        file_data = self._render_config_file("namespace.tpl", cluster_name,
                                             cluster_ports, nfsServer_ip,
                                             network_type)
        yaml_data = yaml.load_all(file_data)
        self._deploy_k8s_resource(yaml_data)

        time.sleep(3)

        current_path = os.path.dirname(__file__)
        templates_path = os.path.join(current_path, "templates", network_type)
        for (dir_path, dir_name, file_list) in os.walk(templates_path):
            for file in file_list:
                # pvc should be created at first
                if "pvc" in file:
                    file_data = self._render_config_file(file, cluster_name,
                                                         cluster_ports,
                                                         nfsServer_ip,
                                                         network_type)
                    yaml_data = yaml.load_all(file_data)
                    self._deploy_k8s_resource(yaml_data)

            time.sleep(3)

            for file in file_list:
                # Then peers
                if "peer" in file:
                    file_data = self._render_config_file(file, cluster_name,
                                                         cluster_ports,
                                                         nfsServer_ip,
                                                         network_type)
                    yaml_data = yaml.load_all(file_data)
                    self._deploy_k8s_resource(yaml_data)

            time.sleep(3)

            if consensus == "solo":
                file_data = self._render_config_file("orderer0.ordererorg.tpl",
                                                     cluster_name,
                                                     cluster_ports,
                                                     nfsServer_ip,
                                                     network_type)
            else:
                file_data = self \
                    ._render_config_file("orderer0.ordererorg-kafka.tpl",
                                         cluster_name,
                                         cluster_ports,
                                         nfsServer_ip,
                                         network_type)

            yaml_data = yaml.load_all(file_data)
            self._deploy_k8s_resource(yaml_data)

            time.sleep(3)

            for file in file_list:
                # Then ca and cli
                if "-ca" in file or "-cli" in file:
                    file_data = self._render_config_file(file, cluster_name,
                                                         cluster_ports,
                                                         nfsServer_ip,
                                                         network_type)
                    yaml_data = yaml.load_all(file_data)
                    self._deploy_k8s_resource(yaml_data)

            time.sleep(3)

    def deploy_cluster(self, cluster_name, ports_index,
                       nfsServer_ip, consensus,
                       network_type=NETWORK_TYPE_FABRIC_V1):
        self._upload_config_file(cluster_name, consensus, network_type)
        time.sleep(1)

        cluster_ports = self._get_cluster_ports(ports_index)

        self._deploy_cluster_resource(cluster_name, cluster_ports,
                                      nfsServer_ip, consensus, network_type)

        check_times = 0
        while check_times < 10:
            if self._is_cluster_pods_running(cluster_name):
                break
            logger.debug("Checking pods status...")
            time.sleep(30)
            check_times += 1

        if check_times == 10:
            logger.error("Failed to create cluster, the pods status is not "
                         "Running.")
            return None

        # Execute commands for cluster
        self._setup_cluster(cluster_name)

        time.sleep(3)

        return self._get_cluster_pods(cluster_name)

    def _delete_cluster_resource(self, cluster_name,
                                 cluster_ports, nfsServer_ip,
                                 consensus, network_type):
        """ The order to delete the cluster is reverse to
            create except for namespace
        """
        current_path = os.path.dirname(__file__)
        templates_path = os.path.join(current_path, "templates", network_type)
        for (dir_path, dir_name, file_list) in os.walk(templates_path):
            for file in file_list:
                if "-ca" in file or "-cli" in file:
                    file_data = self._render_config_file(file, cluster_name,
                                                         cluster_ports,
                                                         nfsServer_ip,
                                                         network_type)
                    yaml_data = yaml.load_all(file_data)
                    self._delete_k8s_resource(yaml_data)

            time.sleep(3)

            for file in file_list:
                if "peer" in file:
                    file_data = self._render_config_file(file,
                                                         cluster_name,
                                                         cluster_ports,
                                                         nfsServer_ip,
                                                         network_type)
                    yaml_data = yaml.load_all(file_data)
                    self._delete_k8s_resource(yaml_data)

            time.sleep(3)

            if consensus == "solo":
                file_data = self._render_config_file("orderer0.ordererorg.tpl",
                                                     cluster_name,
                                                     cluster_ports,
                                                     nfsServer_ip,
                                                     network_type)
            else:
                file_data = self. \
                    _render_config_file("orderer0.ordererorg-kafka.tpl",
                                        cluster_name,
                                        cluster_ports,
                                        nfsServer_ip,
                                        network_type)

            time.sleep(3)

            yaml_data = yaml.load_all(file_data)
            self._delete_k8s_resource(yaml_data)

            for file in file_list:
                if "pvc" in file:
                    file_data = self._render_config_file(file,
                                                         cluster_name,
                                                         cluster_ports,
                                                         nfsServer_ip,
                                                         network_type)
                    yaml_data = yaml.load_all(file_data)
                    self._delete_k8s_resource(yaml_data)

            time.sleep(3)
            file_data = self._render_config_file("namespace.tpl",
                                                 cluster_name,
                                                 cluster_ports,
                                                 nfsServer_ip,
                                                 network_type)
            yaml_data = yaml.load_all(file_data)
            self._delete_k8s_resource(yaml_data)

    def delete_cluster(self, cluster_name, ports_index,
                       nfsServer_ip, consensus,
                       network_type=NETWORK_TYPE_FABRIC_V1):
        cluster_ports = self._get_cluster_ports(ports_index)
        self._delete_cluster_resource(cluster_name, cluster_ports,
                                      nfsServer_ip, consensus,
                                      network_type)
        time.sleep(5)

        # check if the pvs have been deleted before removing the
        # entire folder.
        while not self.check_pvs(cluster_name):
            time.sleep(3)

        while True:
            logger.info("cleaning the namespace {} ... ..."
                        .format(cluster_name))
            namespaces = self.corev1client.list_namespace()
            namespace_list = [n.metadata.name for n in namespaces.items]
            if cluster_name not in namespace_list:
                break
            time.sleep(3)

        time.sleep(5)
        self._delete_config_file(cluster_name)
        return True

    def check_pvs(self, cluster_name):
        mapping_list = [cluster_name + '-ordererorg-pv',
                        cluster_name + '-org1-pv',
                        cluster_name + '-org2-pv',
                        cluster_name + '-org1-resources-pv',
                        cluster_name + '-org2-resources-pv']

        try:
            response = self.corev1client.list_persistent_volume()
            for item in response.items:
                if item.metadata.name in mapping_list:
                    return False

            return True

        except client.rest.ApiException as e:
            logger.error("Exception raised in list pv: %s\n" % e)

    def stop_cluster(self, cluster_name, ports_index, nfsServer_ip,
                     consensus, network_type=NETWORK_TYPE_FABRIC_V1):
        cluster_ports = self._get_cluster_ports(ports_index)
        self._delete_cluster_resource(cluster_name, cluster_ports,
                                      nfsServer_ip, consensus,
                                      network_type)
        time.sleep(2)

        while True:
            logger.info("cleaning the namespace {} ... ..."
                        .format(cluster_name))
            namespaces = self.corev1client.list_namespace()
            namespace_list = [n.metadata.name for n in namespaces.items]
            if cluster_name not in namespace_list:
                break
            time.sleep(3)

        return True

    def start_cluster(self, cluster_name, ports_index, nfsServer_ip,
                      consensus, network_type=NETWORK_TYPE_FABRIC_V1):
        cluster_ports = self._get_cluster_ports(ports_index)
        self._deploy_cluster_resource(cluster_name, cluster_ports,
                                      nfsServer_ip, consensus,
                                      network_type)
        time.sleep(2)
        return self._get_cluster_pods(cluster_name)
