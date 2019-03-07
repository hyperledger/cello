#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import socket
import os
from random import sample
from django.core.exceptions import ObjectDoesNotExist
from api.models import Port, Node

CLUSTER_PORT_START = int(os.getenv("CLUSTER_PORT_START", 7050))
MAX_RETRY = 100

LOG = logging.getLogger(__name__)


def port_is_free(ip=None, port=0):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(1)
    try:
        s.connect((ip, int(port)))
        s.shutdown(socket.SHUT_RDWR)
        return False
    except Exception:
        return True
    finally:
        s.close()


def port_picker(agent_id=None, request_count=1, exclude_ports=None):
    if exclude_ports is None:
        exclude_ports = []

    used_ports = Port.objects.values_list("external").filter(
        node__agent__id=agent_id
    )
    exclude_ports += [port[0] for port in used_ports]

    return sample(
        [
            i
            for i in range(CLUSTER_PORT_START, 65535)
            if i not in exclude_ports
        ],
        request_count,
    )


def find_available_ports(
    ip=None,
    node_id=None,
    agent_id=None,
    request_count=1,
    exclude_ports=None,
    retry=MAX_RETRY,
):
    if node_id is None or agent_id is None or retry == 0:
        return []
    all_port_is_free = True

    if exclude_ports is None:
        exclude_ports = []
    ports = port_picker(agent_id, request_count, exclude_ports)

    for port in ports:
        if not port_is_free(ip, port):
            exclude_ports.append(port)
            all_port_is_free = False

    if not all_port_is_free:
        retry -= 1
        return find_available_ports(
            ip, node_id, agent_id, request_count, exclude_ports, retry
        )

    try:
        node = Node.objects.get(id=node_id)
    except ObjectDoesNotExist:
        return []
    else:
        port_objects = [Port(external=port, node=node) for port in ports]
        Port.objects.bulk_create(port_objects)

    return ports


def set_ports_mapping(node_id=None, mapping=None):
    if mapping is None:
        mapping = []

    for port in mapping:
        Port.objects.filter(
            node__id=node_id, external=port.get("external")
        ).update(internal=port.get("internal"))
