#
# SPDX-License-Identifier: Apache-2.0
#
from __future__ import absolute_import, unicode_literals

import json
import logging
import os

import docker
from django.core.exceptions import ObjectDoesNotExist

from api.common.enums import NodeStatus, AgentOperation
from api.models import Node, Port
from api_engine.celery import app

LOG = logging.getLogger(__name__)
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN")


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
            "AGENT_IP": str(node.agent.ip),
            "AGENT_CONFIG_FILE": agent_config_file,
            "NODE_UPDATE_URL": node_update_api,
            # Token for call update node api
            "TOKEN": ADMIN_TOKEN,
            "OPERATION": AgentOperation.Start.value,
        }
        if node.ca:
            environment.update(
                {
                    "CA_CONFIG": json.dumps(
                        {
                            "admin_name": node.ca.admin_name,
                            "admin_password": node.ca.admin_password,
                            "hosts": ",".join(node.ca.hosts),
                        }
                    )
                }
            )
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
def delete_node(self, node_id=None, **kwargs):
    if node_id is None:
        return False
    agent_config_file = kwargs.get("agent_config_file")

    try:
        node = Node.objects.get(id=node_id)
        environment = {
            "AGENT_ID": str(node.agent.id),
            "AGENT_CONFIG_FILE": agent_config_file,
            "NETWORK_TYPE": node.network_type,
            "NETWORK_VERSION": node.network_version,
            "NODE_TYPE": node.type,
            "NODE_ID": str(node.id),
            "OPERATION": AgentOperation.Delete.value,
        }
        client = docker.from_env()
        client.containers.run(
            node.agent.image,
            auto_remove=True,
            environment=environment,
            detach=True,
        )
    except ObjectDoesNotExist:
        return False
    except Exception as e:
        raise self.retry(exc=e)
    else:
        node.delete()

    return True
