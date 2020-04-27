import logging
import time



from common import log_handler, LOG_LEVEL

import kubernetes.client as client
from kubernetes.client.rest import ApiException


logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

class K8sNetworkOperation():
    """
    Object to operate cluster on kubernetes
    """
    def __init__(self, kube_config):
        client.Configuration.set_default(kube_config)
        self.extendv1client = client.AppsV1Api()
        self.corev1client = client.CoreV1Api()
        self.appv1beta1client = client.AppsV1Api()
        self.support_namespace = ['Deployment', 'Service',
                                  'PersistentVolumeClaim', 'StatefulSet', 'ConfigMap']
        self.create_func_dict = {
            "Deployment": self._create_deployment,
            "Service": self._create_service,
            "PersistentVolume": self._create_persistent_volume,
            "PersistentVolumeClaim": self._create_persistent_volume_claim,
            "Namespace": self._create_namespace,
            "StatefulSet": self._create_statefulset,
            "ConfigMap": self._create_configmap
        }
        self.delete_func_dict = {
            "Deployment": self._delete_deployment,
            "Service": self._delete_service,
            "PersistentVolume": self._delete_persistent_volume,
            "PersistentVolumeClaim": self._delete_persistent_volume_claim,
            "Namespace": self._delete_namespace,
            "StatefulSet": self._delete_statefulset,
            "ConfigMap": self._delete_configmap
        }

    def get_one_availabe_node_ip(self):
        try:
            nodes = self.corev1client.list_node(watch=False)
            for item in nodes.items:
                for con in item.status.conditions:
                    if con.type == 'Ready' and con.status == 'True':
                        for address in item.status.addresses:
                            if address.type == "InternalIP":
                                return address.address

            return None
        except Exception as e:
            logger.error("Kubernetes get node list error msg: {}".format(e))
            return None

    def list_namespaced_pods(self, namespace, label_selector=None):
        try:
            if label_selector is None:
                pods = self.corev1client.list_namespaced_pod(namespace=namespace, watch=False)
            else:
                pods = self.corev1client.list_namespaced_pod(namespace=namespace, label_selector=label_selector, watch=False)
            return pods
        except Exception as e:
            logger.error("Kubernetes get node list error msg: {}".format(e))
            return None


    def deploy_k8s_resource(self, yaml_data):
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

    def delete_k8s_resource(self, yaml_data):
        for data in yaml_data:
            if data is None:
                continue
            kind = data.get('kind', None)
            name = data.get('metadata').get('name', None)
            namespace = data.get('metadata').get('namespace', None)

            body = client.V1DeleteOptions()

            logs = "Delete namespace={}, name={}, kind={}".format(namespace,
                                                                  name,
                                                                  kind)
            logger.info(logs)

            if kind in self.support_namespace:
                self.delete_func_dict.get(kind)(name, namespace, body)
            else:
                self.delete_func_dict.get(kind)(name, body)
            time.sleep(3)

    def _create_statefulset(self, namespace, data, **kwargs):
        try:
            resp = self.appv1beta1client.create_namespaced_stateful_set(namespace,
                                                                    data,
                                                                    **kwargs)
            logger.debug(resp)
        except ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _create_configmap(self, namespace, data, **kwargs):
        try:
            resp = self.corev1client.create_namespaced_config_map(namespace,
                                                                    data,
                                                                    **kwargs)
            logger.debug(resp)
        except ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)


    def _create_deployment(self, namespace, data, **kwargs):
        try:
            resp = self.extendv1client.create_namespaced_deployment(namespace,
                                                                    data,
                                                                    **kwargs)
            logger.debug(resp)
        except ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _create_service(self, namespace, data, **kwargs):
        try:
            resp = self.corev1client.create_namespaced_service(namespace,
                                                               data,
                                                               **kwargs)
            logger.debug(resp)
        except ApiException as e:
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
        except ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _create_persistent_volume(self, data, **kwargs):
        try:
            resp = self.corev1client.create_persistent_volume(data, **kwargs)
            logger.debug(resp)
        except ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _create_namespace(self, data, **kwargs):
        try:
            resp = self.corev1client.create_namespace(data, **kwargs)
            logger.debug(resp)
        except ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _delete_statefulset(self, name, namespace, data, **kwargs ):
        try:
            resp = self.appv1beta1client.\
                delete_namespaced_stateful_set(name, namespace,
                                                       data, **kwargs)
            logger.debug(resp)
        except ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _delete_configmap(self, namespace, data, **kwargs):
        try:
            resp = self.corev1client.delete_namespaced_config_map(namespace,
                                                                  data,
                                                                  **kwargs)
            logger.debug(resp)
        except ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _delete_persistent_volume_claim(self, name, namespace, data, **kwargs):
        try:
            resp = self.corev1client.\
                delete_namespaced_persistent_volume_claim(name, namespace,
                                                          data, **kwargs)
            logger.debug(resp)
        except ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _delete_persistent_volume(self, name, data, **kwargs):
        try:
            resp = self.corev1client.delete_persistent_volume(name, data,
                                                              **kwargs)
            logger.debug(resp)
        except ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _delete_service(self, name, data, namespace, **kwargs):
        try:
            # delete_namespaced_service does not need data actually.
            resp = self.corev1client.delete_namespaced_service(name,
                                                               namespace,
                                                               **kwargs)
            logger.debug(resp)
        except ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _delete_namespace(self, name, data, **kwargs):
        try:
            resp = self.corev1client.delete_namespace(name, data, **kwargs)
            logger.debug(resp)
        except ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

    def _delete_deployment(self, name, namespace, data, **kwargs):
        try:
            resp = self.extendv1client.\
                delete_namespaced_deployment(name, namespace,
                                             data, **kwargs)
            logger.debug(resp)
        except ApiException as e:
            logger.error(e)
        except Exception as e:
            logger.error(e)

