#
# SPDX-License-Identifier: Apache-2.0
#
from __future__ import absolute_import, unicode_literals
from django.core.exceptions import ObjectDoesNotExist
from django.core.files.base import ContentFile
import yaml
from api_engine.celery import app
from api.models import Node, Port
from api.common.enums import NodeStatus, HostType
from api.lib.agent.handler import AgentHandler

import logging

LOG = logging.getLogger(__name__)


@app.task(bind=True, default_retry_delay=5, max_retries=3, time_limit=360)
def create_node(self, node_id=None):
    if node_id is None:
        return False

    try:
        node = Node.objects.get(id=node_id)
        agent_handler = AgentHandler(node)
        if node.agent.type == HostType.Docker.name.lower():
            compose_config = agent_handler.compose_config
            if compose_config:
                node.compose_file.save(
                    "docker-compose.yml",
                    ContentFile(
                        yaml.safe_dump(
                            compose_config, default_flow_style=False
                        )
                    ),
                )
            else:
                node.status = NodeStatus.Error.name.lower()
                node.save()
                return False
        agent_handler.create_node()
    except ObjectDoesNotExist:
        return False
    except Exception as e:
        Port.objects.filter(node__id=node_id).delete()
        raise self.retry(exc=e)

    node.status = NodeStatus.Running.name.lower()
    node.save()

    return True


@app.task(bind=True, default_retry_delay=5, max_retires=3, time_limit=360)
def delete_node(self, node_id=None):
    if node_id is None:
        return False

    try:
        node = Node.objects.get(id=node_id)
        agent_handler = AgentHandler(node)
        agent_handler.delete_node()
    except ObjectDoesNotExist:
        return False
    except Exception as e:
        raise self.retry(exc=e)
    else:
        node.delete()

    return True
