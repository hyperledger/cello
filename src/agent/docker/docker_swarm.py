# This module provides some static api to operate compose and docker engine

import logging
import os

from compose.cli.command import get_project as compose_get_project, \
    get_config_path_from_options as compose_get_config_path_from_options
from compose.config.environment import Environment
from compose.project import OneOffFilter
from docker import Client

from common import log_handler, LOG_LEVEL
from common import \
    HOST_TYPES, \
    CLUSTER_NETWORK, \
    CONSENSUS_PLUGINS, CONSENSUS_MODES, \
    CLUSTER_LOG_TYPES, CLUSTER_LOG_LEVEL, \
    CLUSTER_SIZES, \
    SERVICE_PORTS

COMPOSE_FILE_PATH = os.getenv("COMPOSE_FILE_PATH",
                              "./agent/docker/_compose_files")


logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


def _clean_chaincode_images(daemon_url, name_prefix, timeout=5):
    """ Clean chaincode images, whose name should have cluster id as prefix

    :param daemon_url: Docker daemon url
    :param name_prefix: image name prefix
    :param timeout: Time to wait for the response
    :return: None
    """
    logger.debug("clean chaincode images with prefix={}".format(name_prefix))
    client = Client(base_url=daemon_url, version="auto", timeout=timeout)
    images = client.images()
    id_removes = [e['Id'] for e in images if e['RepoTags'][0].startswith(
        name_prefix)]
    if id_removes:
        logger.debug("chaincode image id to removes=" + ", ".join(id_removes))
    for _ in id_removes:
        client.remove_image(_, force=True)


def _clean_project_containers(daemon_url, name_prefix, timeout=5):
    """
    Clean cluster node containers and chaincode containers

    All containers with the name prefix will be removed.

    :param daemon_url: Docker daemon url
    :param name_prefix: image name prefix
    :param timeout: Time to wait for the response
    :return: None
    """
    logger.debug("Clean project containers, daemon_url={}, prefix={}".format(
        daemon_url, name_prefix))
    client = Client(base_url=daemon_url, version="auto", timeout=timeout)
    containers = client.containers(all=True)
    id_removes = [e['Id'] for e in containers if
                  e['Names'][0].split("/")[-1].startswith(name_prefix)]
    for _ in id_removes:
        client.remove_container(_, force=True)
        logger.debug("Remove container {}".format(_))


def start_containers(daemon_url, name_prefix, timeout=5):
    """Start containers with given prefix

    The chaincode container usually has name with `name_prefix-` as prefix

    :param daemon_url: Docker daemon url
    :param name_prefix: image name prefix
    :param timeout: Time to wait for the response
    :return: None
    """
    logger.debug("Get containers, daemon_url={}, prefix={}".format(
        daemon_url, name_prefix))
    client = Client(base_url=daemon_url, version="auto", timeout=timeout)
    containers = client.containers(all=True)
    id_cc = [e['Id'] for e in containers if
             e['Names'][0].split("/")[-1].startswith(name_prefix)]
    logger.info(id_cc)
    for _ in id_cc:
        client.start(_)


#  Deprecated
#  Normal chaincode container may also become exited temporarily
def _clean_exited_containers(daemon_url):
    """ Clean those containers with exited status

    This is dangerous, as it may delete temporary containers.
    Only trigger this when no one else uses the system.

    :param daemon_url: Docker daemon url
    :return: None
    """
    logger.debug("Clean exited containers")
    client = Client(base_url=daemon_url, version="auto")
    containers = client.containers(quiet=True, all=True,
                                   filters={"status": "exited"})
    id_removes = [e['Id'] for e in containers]
    for _ in id_removes:
        logger.debug("exited container to remove, id={}", _)
        try:
            client.remove_container(_)
        except Exception as e:
            logger.error("Exception in clean_exited_containers {}".format(e))


def check_daemon(daemon_url, timeout=5):
    """ Check if the daemon is active

    Only wait for timeout seconds.

    :param daemon_url: Docker daemon url
    :param timeout: Time to wait for the response
    :return: True for active, False for inactive
    """
    if not daemon_url or not daemon_url.startswith("tcp://"):
        return False
    segs = daemon_url.split(":")
    if len(segs) != 3:
        logger.error("Invalid daemon url = ", daemon_url)
        return False
    try:
        client = Client(base_url=daemon_url, version="auto", timeout=timeout)
        return client.ping() == 'OK'
    except Exception as e:
        logger.error("Exception in check_daemon {}".format(e))
        return False


def detect_daemon_type(daemon_url, timeout=5):
    """ Try to detect the daemon type

    Only wait for timeout seconds.

    :param daemon_url: Docker daemon url
    :param timeout: Time to wait for the response
    :return: host type info
    """
    if not daemon_url or not daemon_url.startswith("tcp://"):
        return None
    segs = daemon_url.split(":")
    if len(segs) != 3:
        logger.error("Invalid daemon url = ", daemon_url)
        return None
    try:
        client = Client(base_url=daemon_url, version="auto", timeout=timeout)
        server_version = client.info()['ServerVersion']
        server_swarm_cluster = client.info()['Swarm']['Cluster']['ID']
        if server_version.startswith('swarm') or server_swarm_cluster != '':
            return HOST_TYPES[1]
        else:
            return HOST_TYPES[0]
    except Exception as e:
        logger.error(e)
        return None


def reset_container_host(host_type, daemon_url, timeout=15):
    """ Try to detect the daemon type

    Only wait for timeout seconds.

    :param host_type: Type of host: single or swarm
    :param daemon_url: Docker daemon url
    :param timeout: Time to wait for the response
    :return: host type info
    """
    try:
        client = Client(base_url=daemon_url, version="auto", timeout=timeout)
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

    return setup_container_host(host_type=host_type, daemon_url=daemon_url)


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


def setup_container_host(host_type, daemon_url, timeout=5):
    """
    Setup a container host for deploying cluster on it

    :param host_type: Docker host type
    :param daemon_url: Docker daemon url
    :param timeout: timeout to wait
    :return: True or False
    """
    if not daemon_url or not daemon_url.startswith("tcp://"):
        logger.error("Invalid daemon_url={}".format(daemon_url))
        return False
    if host_type not in HOST_TYPES:
        logger.error("Invalid host_type={}".format(host_type))
        return False
    try:
        client = Client(base_url=daemon_url, version="auto", timeout=timeout)
        net_names = [x["Name"] for x in client.networks()]
        for cs_type in CONSENSUS_PLUGINS:
            net_name = CLUSTER_NETWORK + "_{}".format(cs_type)
            if net_name in net_names:
                logger.warning("Network {} already exists, use it!".format(
                    net_name))
            else:
                if host_type == HOST_TYPES[0]:  # single
                    client.create_network(net_name, driver='bridge')
                elif host_type == HOST_TYPES[1]:  # swarm
                    client.create_network(net_name, driver='overlay')
                else:
                    logger.error("No-supported host_type={}".format(host_type))
                    return False
    except Exception as e:
        logger.error("Exception happens!")
        logger.error(e)
        return False
    return True


def cleanup_host(daemon_url, timeout=5):
    """
    Cleanup a container host when use removes the host

    Maybe we will remove the networks?

    :param daemon_url: Docker daemon url
    :param timeout: timeout to wait
    :return:
    """
    if not daemon_url or not daemon_url.startswith("tcp://"):
        logger.error("Invalid daemon_url={}".format(daemon_url))
        return False
    try:
        client = Client(base_url=daemon_url, version="auto", timeout=timeout)
        net_names = [x["Name"] for x in client.networks()]
        for cs_type in CONSENSUS_PLUGINS:
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


def _compose_set_env(name, daemon_url, mapped_ports=SERVICE_PORTS,
                     consensus_plugin=CONSENSUS_PLUGINS[0],
                     consensus_mode=CONSENSUS_MODES[0],
                     cluster_size=CLUSTER_SIZES[0],
                     log_level=CLUSTER_LOG_LEVEL[0],
                     log_type=CLUSTER_LOG_TYPES[0], log_server=""):

    envs = {
        'DOCKER_HOST': daemon_url,
        'COMPOSE_PROJECT_NAME': name,
        'COMPOSE_FILE': "cluster-{}.yml".format(cluster_size),
        'VM_ENDPOINT': daemon_url,
        'VM_DOCKER_HOSTCONFIG_NETWORKMODE':
            CLUSTER_NETWORK + "_{}".format(consensus_plugin),
        'PEER_VALIDATOR_CONSENSUS_PLUGIN': consensus_plugin,
        'PBFT_GENERAL_MODE': consensus_mode,
        'PBFT_GENERAL_N': str(cluster_size),
        'PEER_NETWORKID': name,
        'CLUSTER_NETWORK': CLUSTER_NETWORK + "_{}".format(consensus_plugin),
        'CLUSTER_LOG_LEVEL': log_level,
    }
    os.environ.update(envs)

    for k, v in mapped_ports.items():
        os.environ[k.upper() + '_PORT'] = str(v)
    if log_type != CLUSTER_LOG_TYPES[0]:  # not local
        os.environ['SYSLOG_SERVER'] = log_server


def compose_up(name, host, mapped_ports,
               consensus_plugin=CONSENSUS_PLUGINS[0],
               consensus_mode=CONSENSUS_MODES[0],
               cluster_size=CLUSTER_SIZES[0],
               timeout=5, cluster_version='fabric-0.6'):
    """ Compose up a cluster

    :param name: The name of the cluster
    :param mapped_ports: The mapped ports list of the cluster
    :param host: Docker host obj
    :param consensus_plugin: Cluster consensus plugin
    :param consensus_mode: Cluster consensus mode
    :param cluster_size: the size of the cluster
    :param timeout: Docker client timeout value
    :return: The name list of the started peer containers
    """
    logger.debug(
        "Compose start: name={}, host={}, mapped_port={}, consensus={}/{},"
        "size={}".format(
            name, host.get("name"), mapped_ports, consensus_plugin,
            consensus_mode, cluster_size))
    daemon_url, log_type, log_server, log_level = \
        host.get("daemon_url"), host.get("log_type"), host.get("log_server"), \
        host.get("log_level")
    if log_type != CLUSTER_LOG_TYPES[0]:  # not local
        os.environ['SYSLOG_SERVER'] = log_server

    _compose_set_env(name, daemon_url, mapped_ports, consensus_plugin,
                     consensus_mode, cluster_size, log_level, log_type,
                     log_server)
    try:
        project = get_project(COMPOSE_FILE_PATH +
                              "/{}/".format(cluster_version) + log_type)
        containers = project.up(detached=True, timeout=timeout)
    except Exception as e:
        logger.warning("Exception when compose start={}".format(e))
        return {}
    if not containers or cluster_size != len(containers):
        return {}
    result = {}
    for c in containers:
        result[c.name] = c.id
    logger.debug("compose started with containers={}".format(result))
    return result


def compose_clean(name, daemon_url, consensus_plugin):
    """
    Try best to clean a compose project and clean related containers.

    :param name: name of the project
    :param daemon_url: Docker Host url
    :param consensus_plugin: which consensus plugin
    :return: True or False
    """
    has_exception = False
    try:
        compose_down(name=name, daemon_url=daemon_url,
                     consensus_plugin=consensus_plugin)
    except Exception as e:
        logger.error("Error in stop compose project, will clean")
        logger.debug(e)
        has_exception = True
    try:
        _clean_project_containers(daemon_url=daemon_url, name_prefix=name)
    except Exception as e:
        logger.error("Error in clean compose project containers")
        logger.error(e)
        has_exception = True
    try:
        _clean_chaincode_images(daemon_url=daemon_url, name_prefix=name)
    except Exception as e:
        logger.error("Error clean chaincode images")
        logger.error(e)
        # has_exception = True  # may ignore this case
    if has_exception:
        logger.warning("Exception when cleaning project {}".format(name))
        return False
    return True


def compose_start(name, daemon_url, mapped_ports=SERVICE_PORTS,
                  consensus_plugin=CONSENSUS_PLUGINS[0],
                  consensus_mode=CONSENSUS_MODES[0],
                  log_type=CLUSTER_LOG_TYPES[0], log_server="",
                  log_level=CLUSTER_LOG_LEVEL[0],
                  cluster_size=CLUSTER_SIZES[0],
                  cluster_version='fabric-0.6'):
    """ Start the cluster

    :param name: The name of the cluster
    :param mapped_ports: The mapped port list
    :param daemon_url: Docker host daemon
    :param consensus_plugin: Cluster consensus type
    :param consensus_mode: Cluster consensus mode
    :param log_type: which log plugin for host
    :param log_server: syslog server
    :param cluster_size: the size of the cluster
    :return:
    """
    logger.debug("Compose Start {} with daemon_url={}, mapped_ports={} "
                 "consensus={}".format(name, daemon_url, mapped_ports,
                                       consensus_plugin))

    _compose_set_env(name, daemon_url, mapped_ports, consensus_plugin,
                     consensus_mode, cluster_size, log_level, log_type,
                     log_server)
    # project = get_project(COMPOSE_FILE_PATH+"/"+consensus_plugin)
    project = get_project(COMPOSE_FILE_PATH +
                          "/{}/".format(cluster_version) + log_type)
    try:
        project.start()
        start_containers(daemon_url, name + '-')
    except Exception as e:
        logger.warning("Exception when compose start={}".format(e))
        return False
    return True


def compose_restart(name, daemon_url, mapped_ports=SERVICE_PORTS,
                    consensus_plugin=CONSENSUS_PLUGINS[0],
                    consensus_mode=CONSENSUS_MODES[0],
                    log_type=CLUSTER_LOG_TYPES[0], log_server="",
                    log_level=CLUSTER_LOG_LEVEL[0],
                    cluster_size=CLUSTER_SIZES[0],
                    cluster_version='fabric-0.6'):
    """ Restart the cluster

    :param name: The name of the cluster
    :param mapped_ports: The mapped port list
    :param daemon_url: Docker host daemon
    :param consensus_plugin: Cluster consensus type
    :param consensus_mode: Cluster consensus mode
    :param log_type: which log plugin for host
    :param log_server: syslog server
    :param cluster_size: the size of the cluster
    :return:
    """
    logger.debug("Compose restart {} with daemon_url={}, mapped_ports={} "
                 "consensus={}".format(name, daemon_url, mapped_ports,
                                       consensus_plugin))

    _compose_set_env(name, daemon_url, mapped_ports, consensus_plugin,
                     consensus_mode, cluster_size, log_level, log_type,
                     log_server)
    # project = get_project(COMPOSE_FILE_PATH+"/"+consensus_plugin)
    project = get_project(COMPOSE_FILE_PATH +
                          "/{}/".format(cluster_version) + log_type)
    try:
        project.restart()
        start_containers(daemon_url, name + '-')
    except Exception as e:
        logger.warning("Exception when compose restart={}".format(e))
        return False
    return True


def compose_stop(name, daemon_url, mapped_ports=SERVICE_PORTS,
                 consensus_plugin=CONSENSUS_PLUGINS[0],
                 consensus_mode=CONSENSUS_MODES[0],
                 log_type=CLUSTER_LOG_TYPES[0], log_server="",
                 log_level=CLUSTER_LOG_LEVEL[0],
                 cluster_size=CLUSTER_SIZES[0], timeout=5,
                 cluster_version='fabric-0.6'):
    """ Stop the cluster

    :param name: The name of the cluster
    :param mapped_ports: The mapped ports list
    :param daemon_url: Docker host daemon
    :param consensus_plugin: Cluster consensus type
    :param consensus_mode: Cluster consensus mode
    :param log_type: which log plugin for host
    :param log_server: syslog server
    :param cluster_size: the size of the cluster
    :param timeout: Docker client timeout
    :return:
    """
    logger.debug("Compose stop {} with daemon_url={}, mapped_ports={}, "
                 "consensus={}, log_type={}".format(name, daemon_url,
                                                    mapped_ports,
                                                    consensus_plugin,
                                                    log_type))

    _compose_set_env(name, daemon_url, mapped_ports, consensus_plugin,
                     consensus_mode, cluster_size, log_level, log_type,
                     log_server)
    project = get_project(COMPOSE_FILE_PATH +
                          "/{}/".format(cluster_version) + log_type)
    try:
        project.stop(timeout=timeout)
    except Exception as e:
        logger.warning("Exception when compose stop={}".format(e))
        return False
    return True


def compose_down(name, daemon_url, mapped_ports=SERVICE_PORTS,
                 consensus_plugin=CONSENSUS_PLUGINS[0],
                 consensus_mode=CONSENSUS_MODES[0],
                 log_type=CLUSTER_LOG_TYPES[0], log_server="",
                 log_level=CLUSTER_LOG_LEVEL[0],
                 cluster_size=CLUSTER_SIZES[0], timeout=5,
                 cluster_version='fabric-0.6'):
    """ Stop the cluster and remove the service containers

    :param name: The name of the cluster
    :param mapped_ports: The mapped ports list
    :param daemon_url: Docker host daemon
    :param consensus_plugin: Cluster consensus type
    :param consensus_mode: Cluster consensus mode
    :param log_type: which log plugin for host
    :param log_server: syslog server
    :param cluster_size: the size of the cluster
    :param timeout: Docker client timeout
    :return:
    """
    logger.debug("Compose remove {} with daemon_url={}, "
                 "consensus={}".format(name, daemon_url, consensus_plugin))
    # import os, sys
    # compose use this
    _compose_set_env(name, daemon_url, mapped_ports, consensus_plugin,
                     consensus_mode, cluster_size, log_level, log_type,
                     log_server)

    # project = get_project(COMPOSE_FILE_PATH+"/"+consensus_plugin)
    project = get_project(COMPOSE_FILE_PATH +
                          "/{}/".format(cluster_version) + log_type)

    # project.down(remove_orphans=True)
    project.stop(timeout=timeout)
    project.remove_stopped(one_off=OneOffFilter.include, force=True)
