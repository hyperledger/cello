#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import os
from pathlib import Path

from api.lib.agent.base import AgentBase
from api.lib.agent.docker.fabric import FabricNetwork
from compose.cli.command import get_project as compose_get_project
from compose.project import OneOffFilter

try:  # docker 2.x lib is recommended
    from docker import APIClient as Client
except ImportError:  # docker 1.x lib
    from docker import Client

LOG = logging.getLogger(__name__)


class DockerAgent(AgentBase):
    def __init__(self, node=None):
        if node is None:
            node = {}
        self._docker_host = node.get("worker_api")
        self._compose_file = node.get("compose_file")
        self._compose_file_path = os.path.dirname(Path(self._compose_file))
        self._project_name = node.get("name")
        self._network_type = node.get("network_type")
        self._network_version = node.get("network_version")
        self._node_type = node.get("type")
        self._node_id = node.get("id")
        self._agent_id = node.get("agent_id")
        self._network = FabricNetwork(
            version=self._network_version,
            node_type=self._node_type,
            docker_host=self._docker_host,
            agent_id=self._agent_id,
            node_id=self._node_id,
        )

        super(AgentBase, self).__init__()

    def create(self, *args, **kwargs):
        environments = {
            "COMPOSE_PROJECT_NAME": self._project_name,
            "DOCKER_HOST": self._docker_host,
        }
        os.environ.update(environments)

        project = compose_get_project(self._compose_file_path)
        try:
            project.up(detached=True, timeout=10)
        except Exception as e:
            LOG.error(str(e))

    def _clean_network(self):
        client = Client(base_url=self._docker_host, version="auto", timeout=10)
        networks = client.networks(names=["%s_default" % self._project_name])
        id_removes = [e["Id"] for e in networks]
        for network_id in id_removes:
            client.remove_network(network_id)
            LOG.debug("Remove network id {}".format(network_id))

    def delete(self, *args, **kwargs):
        environments = {
            "COMPOSE_PROJECT_NAME": self._project_name,
            "DOCKER_HOST": self._docker_host,
        }
        os.environ.update(environments)

        project = compose_get_project(self._compose_file_path)
        try:
            project.stop(timeout=10)
            project.remove_stopped(one_off=OneOffFilter.include, force=True)
            self._clean_network()
        except Exception as e:
            LOG.error(str(e))

    def generate_config(self):
        return self._network.generate_config()

    def start(self, *args, **kwargs):
        pass

    def stop(self, *args, **kwargs):
        pass
