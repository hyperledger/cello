# Copyright 2018 (c) VMware, Inc. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

import base64
import logging

from common.utils import K8S_CRED_TYPE
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
        k8s_config.host = k8s_params.get('K8SAddress')
        if not k8s_config.host.startswith("https://"):
            k8s_config.host = "https://" + k8s_config.host

        if k8s_params.get('K8SCredType') == K8S_CRED_TYPE['account']:
            k8s_config.username = k8s_params.get('K8SUsername')
            k8s_config.password = k8s_params.get('K8SPassword')

        elif k8s_params.get('K8SCredType') == K8S_CRED_TYPE['cert']:
            cert_content = k8s_params.get('K8SCert')
            key_content = k8s_params.get('K8SKey')
            k8s_config.cert_file = \
                config.kube_config._create_temp_file_with_content(cert_content)
            k8s_config.key_file = \
                config.kube_config._create_temp_file_with_content(key_content)

        # Use config file content to set k8s_config if it exist.
        elif k8s_params.get('K8SCredType') == K8S_CRED_TYPE['config']:
            config_content = k8s_params.get('K8SConfig')

            if config_content.strip():
                config_file = \
                    config.kube_config. \
                    _create_temp_file_with_content(config_content)

                loader = \
                    config.kube_config. \
                    _get_kube_config_loader_for_yaml_file(config_file)

                loader.load_and_set(k8s_config)

        if k8s_params.get('K8SUseSsl') == "false":
            k8s_config.verify_ssl = False
        else:
            k8s_config.verify_ssl = True
            k8s_config.ssl_ca_cert = \
                config.kube_config. \
                _create_temp_file_with_content(k8s_params.get('K8SSslCert'))

        client.Configuration.set_default(k8s_config)

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
