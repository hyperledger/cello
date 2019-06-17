#
# SPDX-License-Identifier: Apache-2.0
#
from __future__ import absolute_import, unicode_literals

import logging

import docker
from django.core.exceptions import ObjectDoesNotExist

from api.common.enums import NodeStatus, AgentOperation
from api.models import Node, Port
from api_engine.celery import app

LOG = logging.getLogger(__name__)


@app.task(bind=True, default_retry_delay=5, max_retries=3, time_limit=360)
def create_node(self, node_id=None, agent_image=None, **kwargs):
    agent_config_file = kwargs.get("agent_config_file")
    node_update_api = kwargs.get("node_update_api")
    if node_id is None:
        return False

    node = None
    try:
        node = Node.objects.get(id=node_id)
        environment = {
            "DEPLOY_NAME": node.name,
            "NETWORK_TYPE": node.network_type,
            "NETWORK_VERSION": node.network_version,
            "NODE_TYPE": node.type,
            "NODE_ID": str(node.id),
            "AGENT_ID": str(node.agent.id),
            "AGENT_CONFIG_FILE": agent_config_file,
            "NODE_UPDATE_URL": node_update_api,
            "OPERATION": AgentOperation.Start,
        }
        client = docker.from_env()
        client.containers.run(
            agent_image, auto_remove=True, environment=environment, detach=True
        )
    except ObjectDoesNotExist:
        return False
    except Exception as e:
        Port.objects.filter(node__id=node_id).delete()
        if node:
            node.status = NodeStatus.Error.name.lower()
            node.save()
        raise self.retry(exc=e)

    return True


@app.task(bind=True, default_retry_delay=5, max_retires=3, time_limit=360)
def delete_node(self, node_id=None):
    if node_id is None:
        return False

    try:
        node = Node.objects.get(id=node_id)
        # agent_handler = AgentHandler(node)
        # agent_handler.delete_node()
    except ObjectDoesNotExist:
        return False
    except Exception as e:
        raise self.retry(exc=e)
    else:
        node.delete()

    return True
