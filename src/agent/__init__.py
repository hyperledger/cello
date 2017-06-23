
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
# Agent pkg provides drivers to those underly platforms, e.g., swarm/k8s.   jAS

from .docker.docker_swarm import get_project, \
    check_daemon, detect_daemon_type, \
    get_swarm_node_ip, \
    compose_up, compose_clean, compose_start, compose_stop, compose_restart, \
    setup_container_host, cleanup_host, reset_container_host

from .docker.host import DockerHost
from .docker.cluster import ClusterOnDocker

from .k8s.host import KubernetesHost
