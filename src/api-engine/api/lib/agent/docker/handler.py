#
# SPDX-License-Identifier: Apache-2.0
#
import logging
from requests import put, get, post
import json

from api.lib.agent.base import AgentBase

LOG = logging.getLogger(__name__)


class DockerAgent(AgentBase):
    """Class represents docker agent."""
    def __init__(self, node=None):
        """init DockerAgent
            param:
            node:Information needed to create, start, and delete nodes, such as organizations, nodes, and so on
            return:null
        """
        if node is None:
            node = {}
        self._id = node.get("id")
        self._name = node.get("name")
        self._urls = node.get("urls")

    def create(self, info):
        """
        Create node

        :param node: Information needed to create nodes
        :return: container ID
        :rtype: string
        """
        try:
            data = {
                'msp': info.get("msp")[2:-1],
                'tls': info.get("tls")[2:-1],
                'bootstrap_block': info.get("bootstrap_block")[2:-1],
                'peer_config_file': info.get("config_file")[2:-1],
                'orderer_config_file': info.get("config_file")[2:-1],
                'img': 'yeasy/hyperledger-fabric:2.2.0',
                'cmd': 'bash /tmp/init.sh "peer node start"' if info.get("type") == "peer" else 'bash /tmp/init.sh "orderer"',
                'name': 'cello-hlf-{}-{}'.format(info.get("type"), info.get("name")),
                'port_map': str(info.get("ports").__repr__()),
                'action': 'create'
            }

            response = post('{}/api/v1/nodes'.format(self._urls), data=data)

            if response.status_code == 200:
                txt = json.loads(response.text)
                return txt['data']['id']
            else:
                return None
        except Exception as e:
            raise e

    def delete(self, *args, **kwargs):
        try:
            response = post('{}/api/v1/nodes/{}'.format(self._urls, kwargs["nid"]), data=kwargs["data"])
            if response.status_code == 200:
                return True
            else:
                raise response.reason
        except Exception as e:
            raise e

    def start(self, *args, **kwargs):
        try:
            response = post('{}/api/v1/nodes/{}'.format(self._urls, kwargs["nid"]), data=kwargs["data"])
            if response.status_code == 200:
                return True
            else:
                raise response.reason
        except Exception as e:
                raise e

    def restart(self, *args, **kwargs):
        try:
            response = post('{}/api/v1/nodes/{}'.format(self._urls, kwargs["nid"]), data=kwargs["data"])
            if response.status_code == 200:
                return True
            else:
                raise response.reason
        except Exception as e:
                raise e

    def stop(self, *args, **kwargs):
        try:
            response = post('{}/api/v1/nodes/{}'.format(self._urls, kwargs["nid"]), data=kwargs["data"])
            if response.status_code == 200:
                return True
            else:
                raise response.reason
        except Exception as e:
                raise e

    def get(self, *args, **kwargs):
        try:
            response = get('{}/api/v1/nodes/{}'.format(self._urls, kwargs["nid"]))
            if response.status_code == 200:
                return True
            else:
                raise response.reason
        except Exception as e:
                raise e


