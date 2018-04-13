# Copyright 2018 (c) VMware, Inc. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

import base64
import logging

from kubernetes import client, config
from common import log_handler, LOG_LEVEL, db, utils

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


class KubernetesOperation():
    """
    Object to operate Kubernetes
    """
    def __init__(self):
        self.k8s_config = client.Configuration()

    def _get_config_from_params(self, k8s_params):
        """ get the configuration from params
        :params: k8s_params to connect to Kubernetes Master node
        :return: python kubernetes config
        """
        k8s_config = client.Configuration()
        k8s_config.host = k8s_params.get('address')
        if not k8s_config.host.startswith("https://"):
            k8s_config.host = "https://" + k8s_config.host

        k8s_config.username = k8s_params.get('username')
        k8s_config.password = k8s_params.get('password')

        cert_content = base64.decodestring(str.encode(k8s_params.get('cert')))
        key_content = base64.decodestring(str.encode(k8s_params.get('key')))

        k8s_config.cert_file = \
            config.kube_config._create_temp_file_with_content(cert_content)

        k8s_config.key_file = \
            config.kube_config._create_temp_file_with_content(key_content)

        config_content = k8s_params.get('config')
        # Use config file content to set k8s_config if it exist.
        if config_content.strip():
            config_file = \
                config.kube_config. \
                _create_temp_file_with_content(config_content)

            loader = \
                config.kube_config. \
                _get_kube_config_loader_for_yaml_file(config_file)

            loader.load_and_set(k8s_config)

        if k8s_params.get('use_ssl') == "false":
            k8s_config.verify_ssl = False
        else:
            k8s_config.verify_ssl = True

        client.Configuration.set_default(k8s_config)

        v1 = client.CoreV1Api()
        try:
            v1.list_pod_for_all_namespaces(watch=False)
        except Exception as e:
            error_msg = (
                "Cannot create kubernetes host due "
                "to an incorrect parameters."
            )
            logger.error("Kubernetes host error msg: {}".format(e))
            raise Exception(error_msg)

        return k8s_config

    def check_host(self, k8s_params):
        """ Check the Kubernetes host pods
        :param : k8s_params to connect to Kubernetes Master node
        :return:
        """
        # Init connection
        """Define the k8s conf in utils.py later"""
        k8s_config = self._get_config_from_params(k8s_params)
        client.Configuration.set_default(k8s_config)

        v1 = client.CoreV1Api()
        try:
            v1.list_pod_for_all_namespaces(watch=False)
        except Exception as e:
            error_msg = (
                "Cannot create kubernetes host due "
                "to an incorrect parameters."
            )
            logger.error("Kubernetes host error msg: {}".format(e))
            raise Exception(error_msg)
        self.k8s_config = k8s_config
        return True

    def refresh_status(self, k8s_params):
        k8s_config = self._get_config_from_params(k8s_params)

        client.Configuration.set_default(k8s_config)
        v1 = client.CoreV1Api()
        try:
            v1.list_node(watch=False)
        except Exception as e:
            error_msg = (
                "Failed to get the kubernetes host status."
            )
            logger.error("Kubernetes host error msg: {}".format(e))
            raise Exception(error_msg)
        self.k8s_config = k8s_config
        return True
