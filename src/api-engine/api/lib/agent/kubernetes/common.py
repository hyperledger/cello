import logging
import os

from django.conf import settings
from kubernetes import client, config
from kubernetes.client.rest import ApiException

LOG = logging.getLogger(__name__)

K8S_NAMESPACE = getattr(settings, "K8S_NAMESPACE", "cello")


class KubernetesClient(object):
    def __init__(self, config_file=None):
        super(KubernetesClient, self).__init__()
        self._config_file = config_file
        config.load_kube_config(config_file)

    def list_pods(self):
        v1 = client.CoreV1Api()
        print("Listing pods with their IPs:")
        ret = v1.list_pod_for_all_namespaces(watch=False)
        for i in ret.items:
            print(
                "%s\t%s\t%s"
                % (i.status.pod_ip, i.metadata.namespace, i.metadata.name)
            )

    def get_or_create_namespace(self, name=None):
        if name:
            v1 = client.CoreV1Api()
            try:
                v1.read_namespace(name=name)
            except ApiException:
                body = client.V1Namespace(
                    kind="Namespace",
                    api_version="v1",
                    metadata=client.V1ObjectMeta(name="cello"),
                )
                try:
                    v1.create_namespace(body=body)
                except ApiException as e:
                    LOG.error(
                        "Exception when calling CoreV1Api->read_namespace: %s",
                        e,
                    )

    def create_deployment(self, namespace=K8S_NAMESPACE, *args, **kwargs):
        containers = kwargs.get("containers", [])
        deploy_name = kwargs.get("name")
        labels = kwargs.get("labels", {})
        labels.update({"app": deploy_name})
        container_pods = []
        for container in containers:
            name = container.get("name")
            image = container.get("image")
            ports = container.get("ports", [])
            environments = container.get("environments", [])
            command = container.get("command", [])
            command_args = container.get("command_args", [])

            environments = [
                client.V1EnvVar(name=env.get("name"), value=env.get("value"))
                for env in environments
            ]
            ports = [
                client.V1ContainerPort(container_port=port) for port in ports
            ]
            container_pods.append(
                client.V1Container(
                    name=name,
                    image=image,
                    env=environments,
                    command=command,
                    args=command_args,
                    ports=ports,
                    image_pull_policy="IfNotPresent",
                )
            )
        deployment_metadata = client.V1ObjectMeta(name=deploy_name)
        pod_spec = client.V1PodSpec(containers=container_pods)
        spec_metadata = client.V1ObjectMeta(labels=labels)
        template_spec = client.V1PodTemplateSpec(
            metadata=spec_metadata, spec=pod_spec
        )
        spec = client.ExtensionsV1beta1DeploymentSpec(template=template_spec)
        body = client.ExtensionsV1beta1Deployment(
            api_version="extensions/v1beta1",
            kind="Deployment",
            metadata=deployment_metadata,
            spec=spec,
        )

        api_instance = client.ExtensionsV1beta1Api()

        try:
            api_instance.create_namespaced_deployment(
                namespace=namespace, body=body, pretty="true"
            )
        except ApiException as e:
            LOG.error("Exception when call AppsV1beta1Api: %s", e)
            raise e

        return True

    def create_service(
        self, namespace=K8S_NAMESPACE, name=None, selector=None, ports=None
    ):
        if selector is None:
            selector = {}
        if ports is None:
            ports = []

        metadata = client.V1ObjectMeta(name=name, labels={"app": name})
        ports = [client.V1ServicePort(port=port) for port in ports]
        spec = client.V1ServiceSpec(ports=ports, selector=selector)
        body = client.V1Service(
            metadata=metadata, spec=spec, kind="Service", api_version="v1"
        )

        api_instance = client.CoreV1Api()
        try:
            api_instance.create_namespaced_service(namespace, body)
        except ApiException as e:
            LOG.error("Exception when call CoreV1Api: %s", e)
            raise e

        return True

    def create_ingress(
        self,
        namespace=K8S_NAMESPACE,
        name=None,
        service_name=None,
        ingress_paths=None,
        annotations=None,
    ):
        if ingress_paths is None:
            ingress_paths = []
        if annotations is None:
            annotations = {}

        api_instance = client.ExtensionsV1beta1Api()
        metadata = client.V1ObjectMeta(name=name, annotations=annotations)
        path_list = []
        for ing_path in ingress_paths:
            ing_backend = client.V1beta1IngressBackend(
                service_name=service_name, service_port=ing_path.get("port", 0)
            )
            path_list.append(
                client.V1beta1HTTPIngressPath(
                    path=ing_path.get("path", ""), backend=ing_backend
                )
            )
        http_dict = client.V1beta1HTTPIngressRuleValue(paths=path_list)
        rule_list = [client.V1beta1IngressRule(http=http_dict, host="")]
        ingress_spec = client.V1beta1IngressSpec(rules=rule_list)
        body = client.V1beta1Ingress(
            api_version="extensions/v1beta1",
            metadata=metadata,
            spec=ingress_spec,
            kind="Ingress",
        )

        try:
            api_instance.create_namespaced_ingress(
                namespace=namespace, body=body, pretty="true"
            )
        except ApiException as e:
            LOG.error("Create ingress failed %s", e)
            raise e

        return True

    def delete_deployment(self, namespace=K8S_NAMESPACE, name=None):
        api_instance = client.ExtensionsV1beta1Api()
        delete_options = client.V1DeleteOptions(
            propagation_policy="Foreground"
        )
        grace_period_seconds = 10

        try:
            api_instance.delete_namespaced_deployment(
                name=name,
                namespace=namespace,
                body=delete_options,
                grace_period_seconds=grace_period_seconds,
                pretty="true",
            )
        except ApiException as e:
            LOG.error("Exception when call AppsV1beta1Api: %s", e)

    def delete_service(self, namespace=K8S_NAMESPACE, name=None):
        api_instance = client.CoreV1Api()

        try:
            api_instance.delete_namespaced_service(
                name=name, namespace=namespace
            )
        except ApiException as e:
            LOG.error("Exception when call CoreV1Api: %s", e)

    def delete_ingress(self, namespace=K8S_NAMESPACE, name=None):
        api_instance = client.ExtensionsV1beta1Api()
        delete_options = client.V1DeleteOptions()

        try:
            api_instance.delete_namespaced_ingress(
                name=name,
                namespace=namespace,
                body=delete_options,
                pretty="true",
            )
        except ApiException as e:
            LOG.error("Exception when call AppsV1beta1Api: %s\n" % e)
