
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import datetime
import logging
import os
import sys
import time
from uuid import uuid4
from threading import Thread
import socket

import requests
from pymongo.collection import ReturnDocument

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from agent import get_swarm_node_ip, KubernetesHost

from common import db, log_handler, LOG_LEVEL, utils
from common import CLUSTER_PORT_START, CLUSTER_PORT_STEP, \
    NETWORK_TYPE_FABRIC_PRE_V1, NETWORK_TYPE_FABRIC_V1, \
    CONSENSUS_PLUGINS_FABRIC_V1, \
    NETWORK_TYPE_FABRIC_V1_1, NETWORK_TYPE_FABRIC_V1_2, \
    WORKER_TYPES, WORKER_TYPE_DOCKER, WORKER_TYPE_SWARM, WORKER_TYPE_K8S, \
    WORKER_TYPE_VSPHERE, VMIP, \
    NETWORK_SIZE_FABRIC_PRE_V1, \
    PEER_SERVICE_PORTS, \
    ORDERER_SERVICE_PORTS, \
    NETWORK_STATUS_CREATING, NETWORK_STATUS_RUNNING, NETWORK_STATUS_DELETING


from common import FabricPreNetworkConfig, FabricV1NetworkConfig

from modules import host

from agent import ClusterOnDocker, ClusterOnVsphere, ClusterOnKubernetes
from modules.models import Cluster as ClusterModel
from modules.models import Host as HostModel
from modules.models import ClusterSchema, CLUSTER_STATE, \
    Container, ServicePort

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

peer_service_ports = {
    'peer{}_org{}_grpc': 7051,
    'peer{}_org{}_event': 7053,
}

ca_service_ports = {
    'ca_org{}_ecap': 7054,
}


class ClusterHandler(object):
    """ Main handler to operate the cluster in pool

    """

    def __init__(self):
        self.col_active = db["cluster_active"]
        self.col_released = db["cluster_released"]
        self.host_handler = host.host_handler
        self.cluster_agents = {
            'docker': ClusterOnDocker(),
            'swarm': ClusterOnDocker(),
            'vsphere': ClusterOnVsphere(),
            'kubernetes': ClusterOnKubernetes()
        }

    def list(self, filter_data=None, col_name="active"):
        """ List clusters with given criteria

        :param filter_data: Image with the filter properties
        :param col_name: Use data in which col_name
        :return: list of serialized doc
        """
        if filter_data is None:
            filter_data = {}
        result = []
        if col_name in [e.name for e in CLUSTER_STATE]:
            logger.debug("List all {} clusters".format(col_name))
            filter_data.update({
                "state": col_name
            })
            clusters = ClusterModel.objects(__raw__=filter_data)
            result = self._schema(clusters, many=True)
        else:
            logger.warning("Unknown cluster col_name=" + col_name)
        return result

    def get_by_id(self, id, col_name="active"):
        """ Get a cluster for the external request

        :param id: id of the doc
        :param col_name: collection to check
        :return: serialized result or obj
        """
        try:
            state = CLUSTER_STATE.active.name if \
                col_name != CLUSTER_STATE.released.name else \
                CLUSTER_STATE.released.name
            logger.info("find state {} cluster".format(state))
            cluster = ClusterModel.objects.get(id=id, state=state)
        except Exception:
            logger.warning("No cluster found with id=" + id)
            return {}
        return self._schema(cluster)

    def gen_service_urls(self, cid, peer_ports, ca_ports, orderer_ports):
        """
        Generate the service urls based on the mapping ports
        :param cid: cluster id to operate with
        :param peer_ports: peer ports mapping
        :param ca_ports: ca ports mapping
        :param orderer_ports: orderer ports mapping
        :return: service url mapping. {} means failure
        """
        access_peer = 'peer0.org1.example.com'
        access_ca = 'ca.example.com'

        peer_host_ip = self._get_service_ip(cid, access_peer)
        # explorer_host_ip = self._get_service_ip(cid, access_explorer)
        # no api_url, then clean and return
        if not peer_host_ip:  # not valid api_url
            logger.error("Error to find peer host url, cleanup")
            self.delete(id=cid, record=False, forced=True)
            return {}
        ca_host_ip = self._get_service_ip(cid, access_ca)

        service_urls = {}
        for k, v in peer_ports.items():
            service_urls[k] = "{}:{}".format(peer_host_ip, v)
        for k, v in ca_ports.items():
            service_urls[k] = "{}:{}".format(ca_host_ip, v)
        for k, v in orderer_ports.items():
            service_urls[k] = "{}:{}".format(ca_host_ip, v)
        return service_urls

    def gen_ports_mapping(self, peer_num, ca_num, start_port, host_id):
        """
        Generate the ports and service mapping for given size of network
        :param peer_num: number of peers
        :param ca_num: number of cas
        :param start_port: mapping range start with
        :param host_id: find ports at which host
        :return: the mapping ports, empty means failure
        """
        request_port_num = \
            peer_num * (len(peer_service_ports.items())) + \
            ca_num * len(ca_service_ports.items()) + \
            len(ORDERER_SERVICE_PORTS.items())
        logger.debug("request port number {}".format(request_port_num))

        if start_port <= 0:  # need to dynamic find available ports
            ports = self.find_free_start_ports(host_id, request_port_num)
        else:
            ports = list(range(start_port, start_port + request_port_num))
        if not ports:
            logger.warning("No free port is found")
            return {}, {}, {}, {}, {}
        else:
            logger.debug("ports {}".format(ports))

        peer_ports, ca_ports, orderer_ports = {}, {}, {}
        all_ports = {}

        if peer_num > 1:
            org_num_list = [1, 2]
            peer_num_end = int(peer_num / 2)
        else:
            org_num_list = [1]
            peer_num_end = 1

        logger.debug("org num list {} peer_num_end {}".
                     format(org_num_list, peer_num_end))

        pos = 0
        for org_num in org_num_list:  # map peer ports
            for peer_num in range(0, peer_num_end):
                for k, v in peer_service_ports.items():
                    peer_ports[k.format(peer_num, org_num)] = ports[pos]
                    logger.debug("pos {}".format(pos))
                    pos += 1
        for org_num in org_num_list:  # map ca ports
            for k, v in ca_service_ports.items():
                ca_ports[k.format(org_num)] = ports[pos]
                logger.debug("pos={}".format(pos))
                pos += 1
        for k, v in ORDERER_SERVICE_PORTS.items():  # orderer ports
            orderer_ports[k] = ports[pos]
            logger.debug("pos={}".format(pos))
            pos += 1

        all_ports.update(peer_ports)
        all_ports.update(ca_ports)
        all_ports.update(orderer_ports)

        return all_ports, peer_ports, ca_ports, orderer_ports

    def _create_cluster(self, cluster, cid, mapped_ports, worker, config,
                        user_id, peer_ports, ca_ports, orderer_ports):
        # start compose project, failed then clean and return
        logger.debug("Start compose project with name={}".format(cid))
        containers = self.cluster_agents[worker.type] \
            .create(cid, mapped_ports, self.host_handler.schema(worker),
                    config=config, user_id=user_id)
        if not containers:
            logger.warning("failed to start cluster={}, then delete"
                           .format(cluster.name))
            self.delete(id=cid, record=False, forced=True)
            return None

        # creation done, update the container table in db
        for k, v in containers.items():
            container = Container(id=v, name=k, cluster=cluster)
            container.save()

        # service urls can only be calculated after service is created
        if worker.type == WORKER_TYPE_K8S:
            service_urls = self.cluster_agents[worker.type]\
                               .get_services_urls(cid)
        else:
            service_urls = self.gen_service_urls(cid, peer_ports,
                                                 ca_ports, orderer_ports)
        # update the service port table in db
        for k, v in service_urls.items():
            service_port = ServicePort(name=k, ip=v.split(":")[0],
                                       port=int(v.split(":")[1]),
                                       cluster=cluster)
            service_port.save()

        # update api_url, container, user_id and status
        self.db_update_one(
            {"id": cid},
            {
                "user_id": user_id,
                'api_url': service_urls.get('rest', ""),
                'service_url': service_urls,
                'status': NETWORK_STATUS_RUNNING
            }
        )

        def check_health_work(cid):
            time.sleep(60)
            self.refresh_health(cid)
        t = Thread(target=check_health_work, args=(cid,))
        t.start()

        host = HostModel.objects.get(id=worker.id)
        host.update(add_to_set__clusters=[cid])
        logger.info("Create cluster OK, id={}".format(cid))

    def create(self, name, host_id, config, start_port=0,
               user_id=""):
        """ Create a cluster based on given data

        TODO: maybe need other id generation mechanism
        Args:

            name: name of the cluster
            host_id: id of the host URL
            config: network configuration
            start_port: first service port for cluster, will generate
             if not given
            user_id: user_id of the cluster if start to be applied

        return: Id of the created cluster or None
        """
        logger.info("Create cluster {}, host_id={}, config={}, start_port={}, "
                    "user_id={}".format(name, host_id, config.get_data(),
                                        start_port, user_id))

        worker = self.host_handler.get_active_host_by_id(host_id)
        if not worker:
            logger.error("Cannot find available host to create new network")
            return None

        if ClusterModel.objects(host=worker).count() >= worker.capacity:
            logger.warning("host {} is already full".format(host_id))
            return None

        peer_num = int(config.get_data().get("size", 4))
        ca_num = 2 if peer_num > 1 else 1

        cid = uuid4().hex
        mapped_ports, peer_ports, ca_ports, orderer_ports = \
            self.gen_ports_mapping(peer_num, ca_num, start_port, host_id)
        if not mapped_ports:
            logger.error("mapped_ports={}".format(mapped_ports))
            return None

        env_mapped_ports = dict(((k + '_port').upper(), str(v))
                                for (k, v) in mapped_ports.items())

        network_type = config['network_type']
        net = {  # net is a blockchain network instance
            'id': cid,
            'name': name,
            'user_id': user_id,
            'worker_api': worker.worker_api,
            'network_type': network_type,  # e.g., fabric-1.0
            'env': env_mapped_ports,
            'status': NETWORK_STATUS_CREATING,
            'mapped_ports': mapped_ports,
            'service_url': {},  # e.g., {rest: xxx:7050, grpc: xxx:7051}
        }
        net.update(config.get_data())

        # try to start one cluster at the host
        cluster = ClusterModel(**net)
        cluster.host = worker
        cluster.save()
        # start cluster creation asynchronously for better user experience.
        t = Thread(target=self._create_cluster, args=(cluster, cid,
                                                      mapped_ports, worker,
                                                      config, user_id,
                                                      peer_ports, ca_ports,
                                                      orderer_ports))
        t.start()
        return cid

    def delete(self, id, record=False, forced=False):
        """ Delete a cluster instance

        Clean containers, remove db entry. Only operate on active host.

        :param id: id of the cluster to delete
        :param record: Whether to record into the released collections
        :param forced: Whether to removing user-using cluster, for release
        :return:
        """
        logger.debug("Delete cluster: id={}, forced={}".format(id, forced))

        try:
            cluster = ClusterModel.objects.get(id=id)
        except Exception:
            logger.warning("Cannot find cluster {}".format(id))
            return False

        c = self.db_update_one({"id": id}, {"status": NETWORK_STATUS_DELETING},
                               after=False)
        # we are safe from occasional applying now
        user_id = c.user_id  # original user_id
        if not forced and user_id != "":
            # not forced, and chain is used by normal user, then no process
            logger.warning("Cannot delete cluster {} by "
                           "user {}".format(id, user_id))
            cluster.update(
                set__user_id=user_id,
                upsert=True
            )
            return False
        else:
            cluster.update(set__status=NETWORK_STATUS_DELETING, upsert=True)

        host_id, worker_api, network_type, consensus_plugin, cluster_size = \
            str(c.host.id), c.worker_api, \
            c.network_type if c.network_type else NETWORK_TYPE_FABRIC_PRE_V1, \
            c.consensus_plugin if c.consensus_plugin else \
            CONSENSUS_PLUGINS_FABRIC_V1[0], \
            c.size if c.size else NETWORK_SIZE_FABRIC_PRE_V1[0]

        # port = api_url.split(":")[-1] or CLUSTER_PORT_START
        h = self.host_handler.get_active_host_by_id(host_id)
        if not h:
            logger.warning("Host {} inactive".format(host_id))
            cluster.update(set__user_id=user_id, upsert=True)
            return False

        if network_type == NETWORK_TYPE_FABRIC_V1:
            config = FabricV1NetworkConfig(consensus_plugin=consensus_plugin,
                                           size=cluster_size)
        elif network_type == NETWORK_TYPE_FABRIC_V1_1:
            config = FabricV1NetworkConfig(consensus_plugin=consensus_plugin,
                                           size=cluster_size)
            config.network_type = NETWORK_TYPE_FABRIC_V1_1
        elif network_type == NETWORK_TYPE_FABRIC_V1_2:
            config = FabricV1NetworkConfig(consensus_plugin=consensus_plugin,
                                           size=cluster_size)
            config.network_type = NETWORK_TYPE_FABRIC_V1_2
        elif network_type == NETWORK_TYPE_FABRIC_PRE_V1:
            config = FabricPreNetworkConfig(consensus_plugin=consensus_plugin,
                                            consensus_mode='',
                                            size=cluster_size)
        else:
            return False

        config.update({
            "env": cluster.env
        })

        delete_result = self.cluster_agents[h.type].delete(id, worker_api,
                                                           config)
        if not delete_result:
            logger.warning("Error to run compose clean work")
            cluster.update(set__user_id=user_id, upsert=True)
            return False

        # remove cluster info from host
        logger.info("remove cluster from host, cluster:{}".format(id))
        h.update(pull__clusters=id)

        c.delete()
        return True

    def delete_released(self, id):
        """ Delete a released cluster record from db

        :param id: id of the cluster to delete
        :return: True or False
        """
        logger.debug("Delete cluster: id={} from release records.".format(id))
        self.col_released.find_one_and_delete({"id": id})
        return True

    def apply_cluster(self, user_id, condition={}, allow_multiple=False):
        """ Apply a cluster for a user

        :param user_id: which user will apply the cluster
        :param condition: the filter to select
        :param allow_multiple: Allow multiple chain for each tenant
        :return: serialized cluster or None
        """
        if not allow_multiple:  # check if already having one
            filt = {"user_id": user_id, "release_ts": "", "health": "OK"}
            filt.update(condition)
            c = self.col_active.find_one(filt)
            if c:
                logger.debug("Already assigned cluster for " + user_id)
                return self._schema(c)
        logger.debug("Try find available cluster for " + user_id)
        cluster = ClusterModel.\
            objects(user_id="",
                    network_type__icontains=condition.get("apply_type",
                                                          "fabric"),
                    size=condition.get("size", 0),
                    status=NETWORK_STATUS_RUNNING,
                    health="OK").first()
        if cluster:
            cluster.update(upsert=True, **{
                "user_id": user_id,
                "apply_ts": datetime.datetime.now()
            })
            logger.info("Now have cluster {} at {} for user {}".format(
                cluster.id, cluster.host.id, user_id))
            return self._schema(cluster)
        logger.warning("Not find matched available cluster for " + user_id)
        return {}

    def release_cluster_for_user(self, user_id):
        """ Release all cluster for a user_id.

        :param user_id: which user
        :return: True or False
        """
        logger.debug("release clusters for user_id={}".format(user_id))
        c = self.col_active.find({"user_id": user_id, "release_ts": ""})
        cluster_ids = list(map(lambda x: x.get("id"), c))
        logger.debug("clusters for user {}={}".format(user_id, cluster_ids))
        result = True
        for cid in cluster_ids:
            result = result and self.release_cluster(cid)
        return result

    def release_cluster(self, cluster_id, record=True):
        """ Release a specific cluster.

        Release means delete and try best to recreate it with same config.

        :param cluster_id: specific cluster to release
        :param record: Whether to record this cluster to release table
        :return: True or False
        """
        c = self.db_update_one(
            {"id": cluster_id},
            {"release_ts": datetime.datetime.now()})
        if not c:
            logger.warning("No cluster find for released with id {}".format(
                cluster_id))
            return True
        if not c.release_ts:  # not have one
            logger.warning("No cluster can be released for id {}".format(
                cluster_id))
            return False

        return self.reset(cluster_id, record)

    def start(self, cluster_id):
        """Start a cluster

        :param cluster_id: id of cluster to start
        :return: Bool
        """
        c = self.get_by_id(cluster_id)
        if not c:
            logger.warning('No cluster found with id={}'.format(cluster_id))
            return False
        h_id = c.get('host_id')
        h = self.host_handler.get_active_host_by_id(h_id)
        if not h:
            logger.warning('No host found with id={}'.format(h_id))
            return False

        network_type = c.get('network_type')
        if network_type == NETWORK_TYPE_FABRIC_PRE_V1:
            config = FabricPreNetworkConfig(
                consensus_plugin=c.get('consensus_plugin'),
                consensus_mode=c.get('consensus_mode'),
                size=c.get('size'))
        elif network_type == NETWORK_TYPE_FABRIC_V1:
            config = FabricV1NetworkConfig(
                consensus_plugin=c.get('consensus_plugin'),
                size=c.get('size'))
        elif network_type == NETWORK_TYPE_FABRIC_V1_1:
            config = FabricV1NetworkConfig(
                consensus_plugin=c.get('consensus_plugin'),
                size=c.get('size'))
            config.network_type = NETWORK_TYPE_FABRIC_V1_1
        elif network_type == NETWORK_TYPE_FABRIC_V1_2:
            config = FabricV1NetworkConfig(
                consensus_plugin=c.get('consensus_plugin'),
                size=c.get('size'))
            config.network_type = NETWORK_TYPE_FABRIC_V1_2
        else:
            return False

        result = self.cluster_agents[h.type].start(
            name=cluster_id, worker_api=h.worker_api,
            mapped_ports=c.get('mapped_ports', PEER_SERVICE_PORTS),
            log_type=h.log_type,
            log_level=h.log_level,
            log_server='',
            config=config,
        )

        if result:
            if h.type == WORKER_TYPE_K8S:
                service_urls = self.cluster_agents[h.type]\
                                   .get_services_urls(cluster_id)
                self.db_update_one({"id": cluster_id},
                                   {'status': 'running',
                                    'api_url': service_urls.get('rest', ""),
                                    'service_url': service_urls})
            else:
                self.db_update_one({"id": cluster_id},
                                   {'status': 'running'})

            return True
        else:
            return False

    def restart(self, cluster_id):
        """Restart a cluster

        :param cluster_id: id of cluster to start
        :return: Bool
        """
        c = self.get_by_id(cluster_id)
        if not c:
            logger.warning('No cluster found with id={}'.format(cluster_id))
            return False
        h_id = c.get('host_id')
        h = self.host_handler.get_active_host_by_id(h_id)
        if not h:
            logger.warning('No host found with id={}'.format(h_id))
            return False

        network_type = c.get('network_type')
        if network_type == NETWORK_TYPE_FABRIC_PRE_V1:
            config = FabricPreNetworkConfig(
                consensus_plugin=c.get('consensus_plugin'),
                consensus_mode=c.get('consensus_mode'),
                size=c.get('size'))
        elif network_type == NETWORK_TYPE_FABRIC_V1:
            config = FabricV1NetworkConfig(
                consensus_plugin=c.get('consensus_plugin'),
                size=c.get('size'))
        elif network_type == NETWORK_TYPE_FABRIC_V1_1:
            config = FabricV1NetworkConfig(
                consensus_plugin=c.get('consensus_plugin'),
                size=c.get('size'))
            config.network_type = NETWORK_TYPE_FABRIC_V1_1
        elif network_type == NETWORK_TYPE_FABRIC_V1_2:
            config = FabricV1NetworkConfig(
                consensus_plugin=c.get('consensus_plugin'),
                size=c.get('size'))
            config.network_type = NETWORK_TYPE_FABRIC_V1_2
        else:
            return False

        result = self.cluster_agents[h.type].restart(
            name=cluster_id, worker_api=h.worker_api,
            mapped_ports=c.get('mapped_ports', PEER_SERVICE_PORTS),
            log_type=h.log_type,
            log_level=h.log_level,
            log_server='',
            config=config,
        )
        if result:
            if h.type == WORKER_TYPE_K8S:
                service_urls = self.cluster_agents[h.type]\
                                   .get_services_urls(cluster_id)
                self.db_update_one({"id": cluster_id},
                                   {'status': 'running',
                                    'api_url': service_urls.get('rest', ""),
                                    'service_url': service_urls})
            else:
                self.db_update_one({"id": cluster_id},
                                   {'status': 'running'})
            return True
        else:
            return False

    def stop(self, cluster_id):
        """Stop a cluster

        :param cluster_id: id of cluster to stop
        :return: Bool
        """
        c = self.get_by_id(cluster_id)
        if not c:
            logger.warning('No cluster found with id={}'.format(cluster_id))
            return False
        h_id = c.get('host_id')
        h = self.host_handler.get_active_host_by_id(h_id)
        if not h:
            logger.warning('No host found with id={}'.format(h_id))
            return False
        network_type = c.get('network_type')
        if network_type == NETWORK_TYPE_FABRIC_PRE_V1:
            config = FabricPreNetworkConfig(
                consensus_plugin=c.get('consensus_plugin'),
                consensus_mode=c.get('consensus_mode'),
                size=c.get('size'))
        elif network_type == NETWORK_TYPE_FABRIC_V1:
            config = FabricV1NetworkConfig(
                consensus_plugin=c.get('consensus_plugin'),
                size=c.get('size'))
        elif network_type == NETWORK_TYPE_FABRIC_V1_1:
            config = FabricV1NetworkConfig(
                consensus_plugin=c.get('consensus_plugin'),
                size=c.get('size'))
            config.network_type = NETWORK_TYPE_FABRIC_V1_1
        elif network_type == NETWORK_TYPE_FABRIC_V1_2:
            config = FabricV1NetworkConfig(
                consensus_plugin=c.get('consensus_plugin'),
                size=c.get('size'))
            config.network_type = NETWORK_TYPE_FABRIC_V1_2
        else:
            return False

        result = self.cluster_agents[h.type].stop(
            name=cluster_id, worker_api=h.worker_api,
            mapped_ports=c.get('mapped_ports', PEER_SERVICE_PORTS),
            log_type=h.log_type,
            log_level=h.log_level,
            log_server='',
            config=config,
        )

        if result:
            self.db_update_one({"id": cluster_id},
                               {'status': 'stopped', 'health': ''})
            return True
        else:
            return False

    def reset(self, cluster_id, record=False):
        """
        Force to reset a chain.

        Delete it and recreate with the same configuration.
        :param cluster_id: id of the reset cluster
        :param record: whether to record into released db
        :return:
        """

        c = self.get_by_id(cluster_id)
        logger.debug("Run recreate_work in background thread")
        cluster_name, host_id, network_type, \
            = c.get("name"), c.get("host_id"), c.get("network_type")
        if not self.delete(cluster_id, record=record, forced=True):
            logger.warning("Delete cluster failed with id=" + cluster_id)
            return False
        network_type = c.get('network_type')
        if network_type == NETWORK_TYPE_FABRIC_V1:
            config = FabricV1NetworkConfig(
                consensus_plugin=c.get('consensus_plugin'),
                size=c.get('size'))
        elif network_type == NETWORK_TYPE_FABRIC_V1_1:
            config = FabricV1NetworkConfig(
                consensus_plugin=c.get('consensus_plugin'),
                size=c.get('size'))
            config.network_type = NETWORK_TYPE_FABRIC_V1_1
        elif network_type == NETWORK_TYPE_FABRIC_V1_2:
            config = FabricV1NetworkConfig(
                consensus_plugin=c.get('consensus_plugin'),
                size=c.get('size'))
            config.network_type = NETWORK_TYPE_FABRIC_V1_2
        else:
            return False
        if not self.create(name=cluster_name, host_id=host_id, config=config):
            logger.warning("Fail to recreate cluster {}".format(cluster_name))
            return False
        return True

    def reset_free_one(self, cluster_id):
        """
        Reset some free chain, mostly because it's broken.

        :param cluster_id: id to reset
        :return: True or False
        """
        logger.debug("Try reseting cluster {}".format(cluster_id))
        self.db_update_one({"id": cluster_id, "user_id": ""},
                           {"status": NETWORK_STATUS_DELETING})
        return self.reset(cluster_id)

    def _serialize(self, doc, keys=('id', 'name', 'user_id', 'host_id',
                                    'network_type',
                                    'consensus_plugin',
                                    'consensus_mode', 'worker_api',
                                    'create_ts', 'apply_ts', 'release_ts',
                                    'duration', 'containers', 'size', 'status',
                                    'health', 'mapped_ports', 'service_url')):
        """ Serialize an obj

        :param doc: doc to serialize
        :param keys: filter which key in the results
        :return: serialized obj
        """
        result = {}
        if doc:
            for k in keys:
                result[k] = doc.get(k, '')
        return result

    def _get_service_ip(self, cluster_id, node='peer0'):
        """
        Get the node's servie ip

        :param cluster_id: The name of the cluster
        :param host: On which host to search the cluster
        :param node: name of the cluster node
        :return: service IP or ""
        """
        host_id = self.get_by_id(cluster_id).get("host_id")
        host = self.host_handler.get_by_id(host_id)
        if not host:
            logger.warning("No host found with cluster {}".format(cluster_id))
            return ""
        worker_api, host_type = host.worker_api, host.type
        if host_type not in WORKER_TYPES:
            logger.warning("Found invalid host_type=%s".format(host_type))
            return ""
        # we should diff with simple host and swarm host here
        if host_type == WORKER_TYPE_DOCKER:  # single
            segs = worker_api.split(":")  # tcp://x.x.x.x:2375
            if len(segs) != 3:
                logger.error("Invalid daemon url = ", worker_api)
                return ""
            host_ip = segs[1][2:]
            logger.debug("single host, ip = {}".format(host_ip))
        elif host_type == WORKER_TYPE_SWARM:  # swarm
            host_ip = get_swarm_node_ip(worker_api, "{}_{}".format(
                cluster_id, node))
            logger.debug("swarm host, ip = {}".format(host_ip))
        elif host_type == WORKER_TYPE_VSPHERE:
            host_ip = host.vcparam[utils.VMIP]
            logger.debug(" host, ip = {}".format(host_ip))
        else:
            logger.error("Unknown host type = {}".format(host_type))
            host_ip = ""
        return host_ip

    def find_free_start_ports(self, host_id, number):
        """ Find the first available port for a new cluster api

        This is NOT lock-free. Should keep simple, fast and safe!

        Check existing cluster records in the host, find available one.

        :param host_id: id of the host
        :param number: Number of ports to get
        :return: The port list, e.g., [7050, 7150, ...]
        """
        logger.debug("Find {} start ports for host {}".format(number, host_id))
        if number <= 0:
            logger.warning("number {} <= 0".format(number))
            return []
        host = self.host_handler.get_by_id(host_id)
        if not host:
            logger.warning("Cannot find host with id={}", host_id)
            return ""

        clusters_exists = ClusterModel.objects(host=host)
        # clusters_valid = list(filter(lambda c: c.get("service_url"),
        #                              clusters_exists))
        # ports_existed = list(map(
        #     lambda c: int(c["service_url"]["rest"].split(":")[-1]),
        #     clusters_valid))
        ports_existed = [service.port for service in
                         ServicePort.objects(cluster__in=clusters_exists)]

        logger.debug("The ports existed: {}".format(ports_existed))
        if len(ports_existed) + number >= 1000:
            logger.warning("Too much ports are already in used.")
            return []
        candidates = [CLUSTER_PORT_START + i * CLUSTER_PORT_STEP
                      for i in range(len(ports_existed) + number)]

        result = list(filter(lambda x: x not in ports_existed, candidates))

        logger.debug("Free ports are {}".format(result[:number]))
        return result[:number]

    def refresh_health(self, cluster_id, timeout=5):
        """
        Check if the peer is healthy by counting its neighbour number
        :param cluster_id: id of the cluster
        :param timeout: how many seconds to wait for receiving response
        :return: True or False
        """
        cluster = self.get_by_id(cluster_id)
        cluster_id = cluster_id
        logger.debug("Cluster ID: {}".format(cluster_id))
        logger.debug("checking health of cluster={}".format(cluster))
        if not cluster:
            logger.warning("Cannot found cluster id={}".format(cluster_id))
            return True
        if cluster.get("status") != "running":
            logger.warning("cluster is not running id={}".format(cluster_id))
            return True
        if cluster.get("network_type") == NETWORK_TYPE_FABRIC_PRE_V1:
            rest_api = cluster["service_url"]["rest"] + "/network/peers"
            if not rest_api.startswith("http"):
                rest_api = "http://" + rest_api
            logger.debug("rest_api={}".format(rest_api))
            logger.debug("---In Network type Fabric V 0.6---")
            try:
                r = requests.get(rest_api, timeout=timeout)
            except Exception as e:
                logger.error("Error to refresh health of cluster {}: {}".
                             format(cluster_id, e))
                return True

            peers = r.json().get("peers")
            logger.debug("peers from rest_api: {}".format(peers))

            if len(peers) == cluster["size"]:
                self.db_update_one({"id": cluster_id},
                                   {"health": "OK"})
                return True
            else:
                logger.debug("checking result of cluster id={}".format(
                    cluster_id, peers))
                self.db_update_one({"id": cluster_id},
                                   {"health": "FAIL"})
                return False
        elif "fabric-1" in cluster.get('network_type'):
            service_url = cluster.get("service_url", {})
            health_ok = True
            for url in service_url.values():
                ip = url.split(":")[0]
                port = int(url.split(":")[1])
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                result = sock.connect_ex((ip, port))
                sock.close()
                logger.debug("check {}:{} result {}".format(ip, port, result))
                if result != 0:
                    health_ok = False
            if not health_ok:
                self.db_update_one({"id": cluster_id},
                                   {"health": "FAIL"})
                return False
            else:
                self.db_update_one({"id": cluster_id},
                                   {"health": "OK"})
                return True
        return True

    def db_update_one(self, filter, operations, after=True, col="active"):
        """
        Update the data into the active db

        :param filter: Which instance to update, e.g., {"id": "xxx"}
        :param operations: data to update to db, e.g., {"$set": {}}
        :param after: return AFTER or BEFORE
        :param col: collection to operate on
        :return: The updated host json dict
        """
        state = CLUSTER_STATE.active.name if col == "active" \
            else CLUSTER_STATE.released.name
        filter.update({
            "state": state
        })
        logger.info("filter {} operations {}".format(filter, operations))
        kwargs = dict(('set__' + k, v) for (k, v) in operations.items())
        for k, v in kwargs.items():
            logger.info("k={}, v={}".format(k, v))
        try:
            ClusterModel.objects(id=filter.get("id")).update(
                upsert=True,
                **kwargs
            )
            doc = ClusterModel.objects.get(id=filter.get("id"))
        except Exception as exc:
            logger.info("exception {}".format(exc.message))
            return None
        return doc

    def _schema(self, doc, many=False):
        cluster_schema = ClusterSchema(many=many)
        return cluster_schema.dump(doc).data


cluster_handler = ClusterHandler()
