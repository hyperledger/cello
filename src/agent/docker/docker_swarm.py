
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
# This module provides some static api to operate compose and docker engine

import logging
import os

from compose.cli.command import get_project as compose_get_project, \
    get_config_path_from_options as compose_get_config_path_from_options
from compose.config.environment import Environment
from compose.project import OneOffFilter

try:  # docker 2.x lib is recommended
    from docker import APIClient as Client
except ImportError:  # docker 1.x lib
    from docker import Client

import sys
if sys.version_info.major == 2:  # py2
    from urlparse import urlparse
else:  # py3
    from urllib.parse import urlparse
from common import log_handler, LOG_LEVEL
from common import \
    WORKER_TYPES, \
    CLUSTER_NETWORK, NETWORK_TYPES, \
    CONSENSUS_PLUGINS_FABRIC_V1, CONSENSUS_MODES, \
    CLUSTER_LOG_TYPES, CLUSTER_LOG_LEVEL, \
    NETWORK_SIZE_FABRIC_PRE_V1, NETWORK_SIZE_FABRIC_V1, \
    SERVICE_PORTS, \
    NETWORK_TYPE_FABRIC_PRE_V1, NETWORK_TYPE_FABRIC_V1, HLF_VERSION

COMPOSE_FILE_PATH = os.getenv("COMPOSE_FILE_PATH",
                              "." + os.sep + "agent" + os.sep + "docker" +
                              os.sep + "_compose_files")

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


def _clean_chaincode_images(worker_api, name_prefix, timeout=5):
    """ Clean chaincode images, whose name should have cluster id as prefix

    :param worker_api: Docker daemon url
    :param name_prefix: image name prefix
    :param timeout: Time to wait for the response
    :return: None
    """
    logger.debug("clean chaincode images with prefix={}".format(name_prefix))
    client = Client(base_url=worker_api, version="auto", timeout=timeout)
    images = client.images()
    id_removes = [e['Id'] for e in images if e['RepoTags'] and
                  e['RepoTags'][0].startswith(name_prefix)]
    logger.debug("chaincode image id to removes=" + ", ".join(id_removes))
    for _ in id_removes:
        client.remove_image(_, force=True)


def _clean_project_containers(worker_api, name_prefix, timeout=5):
    """
    Clean cluster node containers and chaincode containers

    All containers with the name prefix will be removed.

    :param worker_api: Docker daemon url
    :param name_prefix: image name prefix
    :param timeout: Time to wait for the response
    :return: None
    """
    logger.debug("Clean project containers, worker_api={}, prefix={}".format(
        worker_api, name_prefix))
    client = Client(base_url=worker_api, version="auto", timeout=timeout)
    containers = client.containers(all=True)
    id_removes = [e['Id'] for e in containers if
                  e['Names'][0].split("/")[-1].startswith(name_prefix)]
    for _ in id_removes:
        client.remove_container(_, force=True)
        logger.debug("Remove container {}".format(_))


def _clean_project_networks(worker_api, name_prefix, timeout=5):
    """
    Clean cluster node networks

    All containers with the name prefix will be removed.

    :param worker_api: Docker daemon url
    :param name_prefix: image name prefix
    :param timeout: Time to wait for the response
    :return: None
    """
    logger.debug("Clean project networks, worker_api={}, prefix={}".format(
        worker_api, name_prefix))
    client = Client(base_url=worker_api, version="auto", timeout=timeout)
    networks = client.networks(names=["%s_default" % name_prefix])
    id_removes = [e['Id'] for e in networks]
    for network_id in id_removes:
        client.remove_network(network_id)
        logger.debug("Remove network id {}".format(network_id))


def start_containers(worker_api, name_prefix, timeout=5):
    """Start containers with given prefix

    The chaincode container usually has name with `name_prefix-` as prefix

    :param worker_api: Docker daemon url
    :param name_prefix: image name prefix
    :param timeout: Time to wait for the response
    :return: None
    """
    logger.debug("Get containers, worker_api={}, prefix={}".format(
        worker_api, name_prefix))
    client = Client(base_url=worker_api, version="auto", timeout=timeout)
    containers = client.containers(all=True)
    id_cc = [e['Id'] for e in containers if
             e['Names'][0].split("/")[-1].startswith(name_prefix)]
    logger.info(id_cc)
    for _ in id_cc:
        client.start(_)


#  Deprecated
#  Normal chaincode container may also become exited temporarily
def _clean_exited_containers(worker_api):
    """ Clean those containers with exited status

    This is dangerous, as it may delete temporary containers.
    Only trigger this when no one else uses the system.

    :param worker_api: Docker daemon url
    :return: None
    """
    logger.debug("Clean exited containers")
    client = Client(base_url=worker_api, version="auto")
    containers = client.containers(quiet=True, all=True,
                                   filters={"status": "exited"})
    id_removes = [e['Id'] for e in containers]
    for _ in id_removes:
        logger.debug("exited container to remove, id={}", _)
        try:
            client.remove_container(_)
        except Exception as e:
            logger.error("Exception in clean_exited_containers {}".format(e))


def check_daemon(worker_api, timeout=5):
    """ Check if the daemon is active

    Only wait for timeout seconds.

    :param worker_api: Docker daemon url
    :param timeout: Time to wait for the response
    :return: True for active, False for inactive
    """
    if not worker_api or not worker_api.startswith("tcp://"):
        logger.warning("invalid workder_api={}".format(worker_api))
        return False
    segs = worker_api.split(":")
    if len(segs) != 3:
        logger.error("Invalid workder api = ", worker_api)
        return False
    try:
        client = Client(base_url=worker_api, version="auto", timeout=timeout)
        ping_result = client.ping()
        logger.debug("ping_result={}".format(ping_result))
        return ping_result == 'OK' or ping_result is True
    except Exception as e:
        logger.error("Exception in check_daemon {}".format(e))
        return False


def detect_daemon_type(worker_api, timeout=5):
    """ Try to detect the daemon type

    Only wait for timeout seconds.

    :param worker_api: Docker daemon url
    :param timeout: Time to wait for the response
    :return: host type info
    """
    if not worker_api:
        return None
    url = urlparse(worker_api)
    if not url.scheme:
        worker_api = "tcp://" + worker_api  # worker node listen on tcp port
    segs = worker_api.split(":")
    if len(segs) != 3:
        logger.error("Invalid daemon url = ", worker_api)
        return None
    try:
        client = Client(base_url=worker_api, version="auto", timeout=timeout)
        info = client.info()
        server_version = info['ServerVersion']
        if not server_version:
            logger.warning("info().ServerVersion cannot be empty")
            return None
        if server_version.startswith('swarm'):
            return WORKER_TYPES[1]
        try:
            if info['Swarm']['Cluster']['ID'] != '':
                return WORKER_TYPES[1]
        except Exception as e:
            logger.debug(e)
        return WORKER_TYPES[0]
    except Exception as e:
        logger.error(e)
        return None


def reset_container_host(host_type, worker_api, timeout=15):
    """ Try to detect the daemon type

    Only wait for timeout seconds.

    :param host_type: Type of host: single or swarm
    :param worker_api: Docker daemon url
    :param timeout: Time to wait for the response
    :return: host type info
    """
    try:
        client = Client(base_url=worker_api, version="auto", timeout=timeout)
        containers = client.containers(quiet=True, all=True)
        logger.debug(containers)
        for c in containers:
            client.remove_container(c['Id'], force=True)
        logger.debug("cleaning all containers")
    except Exception as e:
        logger.error("Exception happens when reset host!")
        logger.error(e)
        return False
    try:
        images = client.images(all=True)
        logger.debug(images)
        for i in images:
            if i["RepoTags"][0] == "<none>:<none>":
                logger.debug(i)
                try:
                    client.remove_image(i['Id'])
                except Exception as e:
                    logger.error(e)
                    continue
        logger.debug("cleaning <none> images")
    except Exception as e:
        logger.error("Exception happens when reset host!")
        logger.error(e)
        return False

    return setup_container_host(host_type=host_type, worker_api=worker_api)


def get_swarm_node_ip(swarm_url, container_name, timeout=5):
    """
    Detect the host ip where the given container locate in the swarm cluster

    :param swarm_url: Swarm cluster api url
    :param container_name: The container name
    :param timeout: Time to wait for the response
    :return: host ip
    """
    logger.debug("Detect container={} with swarm_url={}".format(
        container_name, swarm_url))
    try:
        client = Client(base_url=swarm_url, version="auto", timeout=timeout)
        info = client.inspect_container(container_name)
        return info['NetworkSettings']['Ports']['5000/tcp'][0]['HostIp']
    except Exception as e:
        logger.error("Exception happens when detect container host!")
        logger.error(e)
        return ''


def setup_container_host(host_type, worker_api, timeout=5):
    """
    Setup a container host for deploying cluster on it

    :param host_type: Docker host type
    :param worker_api: Docker daemon url
    :param timeout: timeout to wait
    :return: True or False
    """
    if not worker_api or not worker_api.startswith("tcp://"):
        logger.error("Invalid worker_api={}".format(worker_api))
        return False
    if host_type not in WORKER_TYPES:
        logger.error("Invalid host_type={}".format(host_type))
        return False
    try:
        client = Client(base_url=worker_api, version="auto", timeout=timeout)
        net_names = [x["Name"] for x in client.networks()]
        for cs_type in CONSENSUS_PLUGINS_FABRIC_V1:
            net_name = CLUSTER_NETWORK + "_{}".format(cs_type)
            if net_name in net_names:
                logger.warning("Network {} already exists, use it!".format(
                    net_name))
            else:
                if host_type == WORKER_TYPES[0]:  # single
                    client.create_network(net_name, driver='bridge')
                elif host_type == WORKER_TYPES[1]:  # swarm
                    client.create_network(net_name, driver='overlay')
                else:
                    logger.error("No-supported host_type={}".format(host_type))
                    return False
    except Exception as e:
        logger.error("Exception happens!")
        logger.error(e)
        return False
    return True


def cleanup_host(worker_api, timeout=5):
    """
    Cleanup a container host when use removes the host

    Maybe we will remove the networks?

    :param worker_api: Docker daemon url
    :param timeout: timeout to wait
    :return:
    """
    if not worker_api or not worker_api.startswith("tcp://"):
        logger.error("Invalid worker_api={}".format(worker_api))
        return False
    try:
        client = Client(base_url=worker_api, version="auto", timeout=timeout)
        net_names = [x["Name"] for x in client.networks()]
        for cs_type in CONSENSUS_PLUGINS_FABRIC_V1:
            net_name = CLUSTER_NETWORK + "_{}".format(cs_type)
            if net_name in net_names:
                logger.debug("Remove network {}".format(net_name))
                client.remove_network(net_name)
            else:
                logger.warning("Network {} not exists!".format(net_name))
    except Exception as e:
        logger.error("Exception happens!")
        logger.error(e)
        return False
    return True


def get_project(template_path):
    """ Get compose project with given template file path

    :param template_path: path of the compose template file
    :return: project object
    """
    environment = Environment.from_env_file(template_path)
    config_path = compose_get_config_path_from_options(template_path, dict(),
                                                       environment)
    project = compose_get_project(template_path, config_path)
    return project


def _compose_set_env(name, worker_api, mapped_ports=SERVICE_PORTS,
                     log_level=CLUSTER_LOG_LEVEL[0],
                     log_type=CLUSTER_LOG_TYPES[0], log_server="",
                     config=None):
    envs = {
        'COMPOSE_PROJECT_NAME': name,
        'CLUSTER_LOG_LEVEL': log_level,
        'CLUSTER_NETWORK': CLUSTER_NETWORK + "_{}".format(
            config['consensus_plugin']),
        'DOCKER_HOST': worker_api,
        'PEER_NETWORKID': name,
        'NETWORK_TYPES': config['network_type'],
        'VM_ENDPOINT': worker_api,
        'VM_DOCKER_HOSTCONFIG_NETWORKMODE':
            CLUSTER_NETWORK + "_{}".format(config['consensus_plugin']),
        'HLF_VERSION': HLF_VERSION,
    }
    if config['network_type'] == NETWORK_TYPE_FABRIC_V1:
        envs.update({
            'COMPOSE_FILE': "fabric-{}-{}.yaml".format(
                config['consensus_plugin'],
                config['size']),
            'COMPOSE_PROJECT_PATH': '/opt/cello/fabric-1.0/local',
        })
    elif config['network_type'] == NETWORK_TYPE_FABRIC_PRE_V1:
        envs.update({
            'COMPOSE_FILE': "fabric-{}.yml".format(config['size']),
            'PEER_VALIDATOR_CONSENSUS_PLUGIN': config['consensus_plugin'],
            'PBFT_GENERAL_MODE': config['consensus_mode'],
            'PBFT_GENERAL_N': str(config['size']),
        })
    envs.update(config.get("env", {}))
    logger.debug("envs {}".format(envs))
    os.environ.update(envs)

    for k, v in mapped_ports.items():
        os.environ[k.upper() + '_PORT'] = str(v)
    if log_type != CLUSTER_LOG_TYPES[0]:  # not local  TODO: deprecated soon
        os.environ['SYSLOG_SERVER'] = log_server


def compose_up(name, host, mapped_ports, config=None, timeout=5):
    """ Compose up a cluster

    :param name: The name of the cluster
    :param mapped_ports: The mapped ports list of the cluster
    :param host: Docker host obj
    :param config: the blockchain network config
    :param timeout: Docker client timeout value
    :return: The name list of the started peer containers
    """

    logger.debug(
        "Compose start: name={}, host={}, mapped_port={},"
        "config={}".format(
            name, host.get("name"), mapped_ports,
            config.get_data()))
    worker_api, log_type, log_server, log_level = \
        host.get("worker_api"), host.get("log_type"), host.get("log_server"), \
        host.get("log_level")
    if log_type != CLUSTER_LOG_TYPES[0]:  # not local
        os.environ['SYSLOG_SERVER'] = log_server

    _compose_set_env(name, worker_api, mapped_ports, log_level, log_type,
                     log_server, config)

    try:
        template_path = COMPOSE_FILE_PATH + os.sep + config['network_type'] + \
            os.sep + log_type
        logger.debug('template path {}'.format(template_path))
        project = get_project(template_path)
        containers = project.up(detached=True, timeout=timeout)
    except Exception as e:
        logger.warning("Exception when compose start={}".format(e))
        return {}
    logger.debug("containers={}".format(containers))
    if not containers or config['size'] > len(containers):
        return {}
    result = {}
    for c in containers:
        result[c.name] = c.id
    logger.debug("compose started with containers={}".format(result))
    return result


def compose_clean(name, worker_api, config):
    """
    Try best to clean a compose project and clean related containers.

    :param name: name of the project
    :param worker_api: Docker Host url
    :param config: network config
    :return: True or False
    """
    has_exception = False
    try:
        compose_down(name=name, worker_api=worker_api, config=config)
    except Exception as e:
        logger.error("Error in stop compose project, will clean")
        logger.debug(e)
        has_exception = True
    try:
        _clean_project_containers(worker_api=worker_api, name_prefix=name)
    except Exception as e:
        logger.error("Error in clean compose project containers")
        logger.error(e)
        has_exception = True
    try:
        _clean_project_networks(worker_api=worker_api, name_prefix=name)
    except Exception as e:
        logger.error("Error in clean compose project networks")
        logger.error(e)
        has_exception = True
    try:
        _clean_chaincode_images(worker_api=worker_api, name_prefix=name)
    except Exception as e:
        logger.error("Error clean chaincode images")
        logger.error(e)
        # has_exception = True  # may ignore this case
    if has_exception:
        logger.warning("Exception when cleaning project {}".format(name))
        return False
    return True


def compose_start(name, worker_api, mapped_ports=SERVICE_PORTS,
                  log_type=CLUSTER_LOG_TYPES[0], log_server="",
                  log_level=CLUSTER_LOG_LEVEL[0],
                  config=None):
    """ Start the cluster

    :param name: The name of the cluster
    :param worker_api: Docker host daemon
    :param mapped_ports: The mapped port list
    :param log_type: which log plugin for host
    :param log_server: syslog server
    :param log_level: level of the logging msg
    :param config: network config
    :return:
    """
    logger.debug("Compose Start {} with worker_api={}, mapped_ports={} "
                 "config={}".format(name, worker_api,
                                    mapped_ports,
                                    config.get_data()))

    _compose_set_env(name, worker_api, mapped_ports, log_level, log_type,
                     log_server, config)

    # project = get_project(COMPOSE_FILE_PATH+"/"+consensus_plugin)
    project = get_project(COMPOSE_FILE_PATH +
                          "/{}/".format(config['network_type']) + log_type)
    try:
        project.start()
        start_containers(worker_api, name + '-')
    except Exception as e:
        logger.warning("Exception when compose start={}".format(e))
        return False
    return True


def compose_restart(name, worker_api, mapped_ports=SERVICE_PORTS,
                    log_type=CLUSTER_LOG_TYPES[0], log_server="",
                    log_level=CLUSTER_LOG_LEVEL[0],
                    config=None):
    """ Restart the cluster

    :param name: The name of the cluster
    :param worker_api: Docker host daemon
    :param mapped_ports: The mapped port list
    :param log_type: which log plugin for host
    :param log_server: syslog server
    :param log_level: level of the logging msg
    :param config: network config
    :return:
    """
    logger.debug("Compose restart {} with worker_api={}, mapped_ports={} "
                 "config={}".format(name, worker_api, mapped_ports,
                                    config.get_data()))

    _compose_set_env(name, worker_api, mapped_ports, log_level, log_type,
                     log_server, config)

    # project = get_project(COMPOSE_FILE_PATH+"/"+consensus_plugin)
    project = get_project(COMPOSE_FILE_PATH + os.sep + config['network_type'] +
                          os.sep + log_type)
    try:
        project.restart()
        start_containers(worker_api, name + '-')
    except Exception as e:
        logger.warning("Exception when compose restart={}".format(e))
        return False
    return True


def compose_stop(name, worker_api, mapped_ports=SERVICE_PORTS,
                 log_type=CLUSTER_LOG_TYPES[0], log_server="",
                 log_level=CLUSTER_LOG_LEVEL[0],
                 config=None, timeout=5):
    """ Stop the cluster

    :param name: The name of the cluster
    :param worker_api: Docker host daemon
    :param mapped_ports: The mapped ports list
    :param log_type: which log plugin for host
    :param log_server: syslog server
    :param log_level: level of the logging msg
    :param config: network config
    :param timeout: Docker client timeout
    :return:
    """
    logger.debug("Compose stop {} with worker_api={}, mapped_ports={}, "
                 "config={}, log_type={}".format(name, worker_api,
                                                 mapped_ports,
                                                 config.get_data(),
                                                 log_type))

    _compose_set_env(name, worker_api, mapped_ports, log_level, log_type,
                     log_server, config)

    project = get_project(COMPOSE_FILE_PATH + os.sep + config['network_type'] +
                          os.sep + log_type)
    try:
        project.stop(timeout=timeout)
    except Exception as e:
        logger.warning("Exception when compose stop={}".format(e))
        return False
    return True


def compose_down(name, worker_api, mapped_ports=SERVICE_PORTS,
                 log_type=CLUSTER_LOG_TYPES[0], log_server="",
                 log_level=CLUSTER_LOG_LEVEL[0],
                 config=None, timeout=5):
    """ Stop the cluster and remove the service containers

    :param name: The name of the cluster
    :param mapped_ports: The mapped ports list
    :param worker_api: Docker host daemon
    :param log_type: which log plugin for host
    :param log_server: syslog server
    :param log_level: level of the logging
    :param config: network config
    :param timeout: Docker client timeout
    :return:
    """
    logger.debug("Compose remove {} with worker_api={}, config={}".format(
        name, worker_api, config.get_data()))

    _compose_set_env(name, worker_api, mapped_ports, log_level, log_type,
                     log_server, config)

    # project = get_project(COMPOSE_FILE_PATH+"/"+consensus_plugin)
    logger.debug(os.environ)
    project = get_project(COMPOSE_FILE_PATH + os.sep + config['network_type'] +
                          os.sep + log_type)

    # project.down(remove_orphans=True)
    project.stop(timeout=timeout)
    project.remove_stopped(one_off=OneOffFilter.include, force=True)
