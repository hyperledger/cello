import datetime
import logging
import os
import sys
import time
from threading import Thread

import requests
from pymongo.collection import ReturnDocument

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import db, log_handler, LOG_LEVEL

from agent import get_swarm_node_ip

from common import CLUSTER_PORT_START, CLUSTER_PORT_STEP, CONSENSUS_PLUGINS, \
    CONSENSUS_MODES, HOST_TYPES, SYS_CREATOR, SYS_DELETER, SYS_USER, \
    SYS_RESETTING, CLUSTER_SIZES, PEER_SERVICE_PORTS, CA_SERVICE_PORTS

from modules import host

from agent import ClusterOnDocker

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


class ClusterHandler(object):
    """ Main handler to operate the cluster in pool

    """

    def __init__(self):
        self.col_active = db["cluster_active"]
        self.col_released = db["cluster_released"]
        self.host_handler = host.host_handler
        self.cluster_agents = {
            'docker': ClusterOnDocker(),
            'swarm': ClusterOnDocker()
        }

    def list(self, filter_data={}, col_name="active"):
        """ List clusters with given criteria

        :param filter_data: Image with the filter properties
        :param col_name: Use data in which col_name
        :return: list of serialized doc
        """
        result = []
        if col_name == "active":
            logger.debug("List all active clusters")
            result = list(map(self._serialize, self.col_active.find(
                filter_data)))
        elif col_name == "released":
            logger.debug("List all released clusters")
            result = list(map(self._serialize, self.col_released.find(
                filter_data)))
        else:
            logger.warning("Unknown cluster col_name=" + col_name)
        return result

    def get_by_id(self, id, col_name="active"):
        """ Get a cluster for the external request

        :param id: id of the doc
        :param col_name: collection to check
        :return: serialized result or obj
        """
        if col_name != "released":
            # logger.debug("Get a cluster with id=" + id)
            cluster = self.col_active.find_one({"id": id})
        else:
            # logger.debug("Get a released cluster with id=" + id)
            cluster = self.col_released.find_one({"id": id})
        if not cluster:
            logger.warning("No cluster found with id=" + id)
            return {}
        return self._serialize(cluster)

    def create(self, name, host_id, start_port=0, user_id="",
               consensus_plugin=CONSENSUS_PLUGINS[0],
               consensus_mode=CONSENSUS_MODES[0], size=CLUSTER_SIZES[0]):
        """ Create a cluster based on given data

        TODO: maybe need other id generation mechanism

        :param name: name of the cluster
        :param host_id: id of the host URL
        :param start_port: first service port for cluster, will generate
         if not given
        :param user_id: user_id of the cluster if start to be applied
        :param consensus_plugin: type of the consensus type
        :param size: size of the cluster, int type
        :return: Id of the created cluster or None
        """
        logger.info("Create cluster {}, host_id={}, consensus={}/{}, "
                    "size={}".format(name, host_id, consensus_plugin,
                                     consensus_mode, size))

        h = self.host_handler.get_active_host_by_id(host_id)
        if not h:
            return None

        if len(h.get("clusters")) >= h.get("capacity"):
            logger.warning("host {} is full already".format(host_id))
            return None

        daemon_url = h.get("daemon_url")
        logger.debug("daemon_url={}".format(daemon_url))

        if start_port <= 0:
            ports = self.find_free_start_ports(host_id, 1)
            if not ports:
                logger.warning("No free port is found")
                return None
            start_port = ports[0]

        peer_mapped_ports, ca_mapped_ports, mapped_ports = {}, {}, {}
        for k, v in PEER_SERVICE_PORTS.items():
            peer_mapped_ports[k] = v - PEER_SERVICE_PORTS['rest'] + start_port
        for k, v in CA_SERVICE_PORTS.items():
            ca_mapped_ports[k] = v - PEER_SERVICE_PORTS['rest'] + start_port

        mapped_ports.update(peer_mapped_ports)
        mapped_ports.update(ca_mapped_ports)

        c = {
            'id': '',
            'name': name,
            'user_id': user_id or SYS_CREATOR,  # avoid applied
            'host_id': host_id,
            'daemon_url': daemon_url,
            'consensus_plugin': consensus_plugin,
            'consensus_mode': consensus_mode,
            'create_ts': datetime.datetime.now(),
            'apply_ts': '',
            'release_ts': '',
            'duration': '',
            'mapped_ports': mapped_ports,
            'service_url': {},  # e.g., {rest: xxx:7050, grpc: xxx:7051}
            'size': size,
            'containers': [],
            'status': 'running',
            'health': ''
        }
        uuid = self.col_active.insert_one(c).inserted_id  # object type
        cid = str(uuid)
        self.col_active.update_one({"_id": uuid}, {"$set": {"id": cid}})
        # try to add one cluster to host
        h = self.host_handler.db_update_one(
            {"id": host_id}, {"$addToSet": {"clusters": cid}})
        if not h or len(h.get("clusters")) > h.get("capacity"):
            self.col_active.delete_one({"id": cid})
            self.host_handler.db_update_one({"id": host_id},
                                            {"$pull": {"clusters": cid}})
            return None

        # from now on, we should be safe

        # start compose project, failed then clean and return
        logger.debug("Start compose project with name={}".format(cid))
        containers = self.cluster_agents[h.get('type')]\
            .create(cid, mapped_ports, h, user_id=user_id,
                    consensus_plugin=consensus_plugin,
                    consensus_mode=consensus_mode, size=size)
        if not containers:
            logger.warning("failed to start cluster={}, then delete"
                           .format(name))
            self.delete(id=cid, record=False, forced=True)
            return None

        peer_host_ip = self._get_service_ip(cid, 'vp0')
        ca_host_ip = self._get_service_ip(cid, 'membersrvc')
        # no api_url, then clean and return
        if not peer_host_ip:  # not valid api_url
            logger.error("Error to find peer host url, cleanup")
            self.delete(id=cid, record=False, forced=True)
            return None

        service_urls = {}
        for k, v in peer_mapped_ports.items():
            service_urls[k] = "{}:{}".format(peer_host_ip, v)

        for k, v in ca_mapped_ports.items():
            service_urls[k] = "{}:{}".format(ca_host_ip, v)

        # update api_url, container, and user_id field
        self.db_update_one(
            {"id": cid},
            {"$set": {"containers": containers, "user_id": user_id,
                      'api_url': service_urls['rest'],
                      'service_url': service_urls}})

        def check_health_work(cid):
            time.sleep(5)
            self.refresh_health(cid)

        t = Thread(target=check_health_work, args=(cid,))
        t.start()

        logger.info("Create cluster OK, id={}".format(cid))
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

        c = self.db_update_one({"id": id}, {"$set": {"user_id": SYS_DELETER}},
                               after=False)
        if not c:
            logger.warning("Cannot find cluster {}".format(id))
            return False
        # we are safe from occasional applying now
        user_id = c.get("user_id")  # original user_id
        if not forced and user_id != "" and not user_id.startswith(SYS_USER):
            # not forced, and chain is used by normal user, then no process
            logger.warning("Cannot delete cluster {} by "
                           "user {}".format(id, user_id))
            self.col_active.update_one({"id": id},
                                       {"$set": {"user_id": user_id}})
            return False

        # 0. forced
        #  1. user_id == SYS_DELETER or ""
        #  Then, add deleting flag to the db, and start deleting
        if not user_id.startswith(SYS_DELETER):
            self.col_active.update_one(
                {"id": id},
                {"$set": {"user_id": SYS_DELETER + user_id}})
        host_id, daemon_url, consensus_plugin = \
            c.get("host_id"), c.get("daemon_url"), \
            c.get("consensus_plugin", CONSENSUS_PLUGINS[0])
        # port = api_url.split(":")[-1] or CLUSTER_PORT_START
        h = self.host_handler.get_active_host_by_id(host_id)
        if not h:
            logger.warning("Host {} inactive".format(host_id))
            self.col_active.update_one({"id": id},
                                       {"$set": {"user_id": user_id}})
            return False

        if not self.cluster_agents[h.get('type')]\
                .delete(id, daemon_url, consensus_plugin):
            logger.warning("Error to run compose clean work")
            self.col_active.update_one({"id": id},
                                       {"$set": {"user_id": user_id}})
            return False

        self.host_handler.db_update_one({"id": c.get("host_id")},
                                        {"$pull": {"clusters": id}})
        self.col_active.delete_one({"id": id})
        if record:  # record original c into release collection
            logger.debug("Record the cluster info into released collection")
            c["release_ts"] = datetime.datetime.now()
            c["duration"] = str(c["release_ts"] - c["apply_ts"])
            # seems mongo reject timedelta type
            if user_id.startswith(SYS_DELETER):
                c["user_id"] = user_id[len(SYS_DELETER):]
            self.col_released.insert_one(c)
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
                return self._serialize(c)
        logger.debug("Try find available cluster for " + user_id)
        hosts = self.host_handler.list({"status": "active",
                                        "schedulable": "true"})
        host_ids = [h.get("id") for h in hosts]
        logger.debug("Find active and schedulable hosts={}".format(host_ids))
        for h_id in host_ids:  # check each active and schedulable host
            filt = {"user_id": "", "host_id": h_id, "health": "OK"}
            filt.update(condition)
            c = self.db_update_one(
                filt,
                {"$set": {"user_id": user_id,
                          "apply_ts": datetime.datetime.now()}})
            if c and c.get("user_id") == user_id:
                logger.info("Now have cluster {} at {} for user {}".format(
                    c.get("id"), h_id, user_id))
                return self._serialize(c)
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
            {"$set": {"release_ts": datetime.datetime.now()}})
        if not c:
            logger.warning("No cluster find for released with id {}".format(
                cluster_id))
            return True
        if not c.get("release_ts"):  # not have one
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
        result = self.cluster_agents[h.get('type')].start(
            name=cluster_id, daemon_url=h.get('daemon_url'),
            mapped_ports=c.get('mapped_ports', PEER_SERVICE_PORTS),
            consensus_plugin=c.get('consensus_plugin'),
            consensus_mode=c.get('consensus_mode'),
            log_type=h.get('log_type'),
            log_level=h.get('log_level'),
            log_server='',
            cluster_size=c.get('size'),
        )
        if result:
            self.db_update_one({"id": cluster_id},
                               {"$set": {'status': 'running'}})
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
        result = self.cluster_agents[h.get('type')].restart(
            name=cluster_id, daemon_url=h.get('daemon_url'),
            mapped_ports=c.get('mapped_ports', PEER_SERVICE_PORTS),
            consensus_plugin=c.get('consensus_plugin'),
            consensus_mode=c.get('consensus_mode'),
            log_type=h.get('log_type'),
            log_level=h.get('log_level'),
            log_server='',
            cluster_size=c.get('size'),
        )
        if result:
            self.db_update_one({"id": cluster_id},
                               {"$set": {'status': 'running'}})
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
        result = self.cluster_agents[h.get('type')].stop(
            name=cluster_id, daemon_url=h.get('daemon_url'),
            mapped_ports=c.get('mapped_ports', PEER_SERVICE_PORTS),
            consensus_plugin=c.get('consensus_plugin'),
            consensus_mode=c.get('consensus_mode'),
            log_type=h.get('log_type'),
            log_level=h.get('log_level'),
            log_server='',
            cluster_size=c.get('size'),
        )
        if result:
            self.db_update_one({"id": cluster_id},
                               {"$set": {'status': 'stopped', 'health': ''}})
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
        cluster_name, host_id, mapped_ports, consensus_plugin, \
            consensus_mode, size = \
            c.get("name"), c.get("host_id"), \
            c.get("mapped_ports"), c.get("consensus_plugin"), \
            c.get("consensus_mode"), c.get("size")
        if not self.delete(cluster_id, record=record, forced=True):
            logger.warning("Delete cluster failed with id=" + cluster_id)
            return False
        if not self.create(name=cluster_name, host_id=host_id,
                           start_port=mapped_ports['rest'],
                           consensus_plugin=consensus_plugin,
                           consensus_mode=consensus_mode, size=size):
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
        c = self.db_update_one({"id": cluster_id, "user_id": ""},
                               {"$set": {"user_id": SYS_RESETTING}})
        if c.get("user_id") != SYS_RESETTING:  # not have one
            logger.warning("No free cluster can be reset for id {}".format(
                cluster_id))
            return False
        return self.reset(cluster_id)

    def _serialize(self, doc, keys=('id', 'name', 'user_id', 'host_id',
                                    'consensus_plugin',
                                    'consensus_mode', 'daemon_url',
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

    def _get_service_ip(self, cluster_id, node='vp0'):
        """

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
        daemon_url, host_type = host.get('daemon_url'), host.get('type')
        if host_type not in HOST_TYPES:
            logger.warning("Found invalid host_type=%s".format(host_type))
            return ""
        # we should diff with simple host and swarm host here
        if host_type == HOST_TYPES[0]:  # single
            segs = daemon_url.split(":")  # tcp://x.x.x.x:2375
            if len(segs) != 3:
                logger.error("Invalid daemon url = ", daemon_url)
                return ""
            host_ip = segs[1][2:]
            logger.debug("single host, ip = {}".format(host_ip))
        elif host_type == HOST_TYPES[1]:  # swarm
            host_ip = get_swarm_node_ip(daemon_url, "{}_{}".format(
                cluster_id, node))
            logger.debug("swarm host, ip = {}".format(host_ip))
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
        if not self.host_handler.get_by_id(host_id):
            logger.warning("Cannot find host with id={}", host_id)
            return ""

        clusters_exists = self.col_active.find({"host_id": host_id})
        clusters_valid = list(filter(lambda c: c.get("service_url"),
                                     clusters_exists))
        ports_existed = list(map(
            lambda c: int(c["service_url"]["rest"].split(":")[-1]),
            clusters_valid))

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
        logger.debug("checking health of cluster id={}".format(cluster_id))
        cluster = self.get_by_id(cluster_id)
        if not cluster:
            logger.warning("Cannot found cluster id={}".format(cluster_id))
            return True
        if cluster.get('status') != 'running':
            logger.warning("cluster is not running id={}".format(cluster_id))
            return True
        rest_api = cluster["service_url"]['rest'] + "/network/peers"
        if not rest_api.startswith('http'):
            rest_api = 'http://' + rest_api
        try:
            r = requests.get(rest_api, timeout=timeout)
        except Exception as e:
            logger.error("Error to refresh health of cluster {}: {}".format(
                cluster_id, e))
            return True

        peers = r.json().get("peers")

        if len(peers) == cluster["size"]:
            self.db_update_one({"id": cluster_id},
                               {"$set": {"health": "OK"}})
            return True
        else:
            logger.debug("checking result of cluster id={}".format(
                cluster_id, peers))
            self.db_update_one({"id": cluster_id},
                               {"$set": {"health": "FAIL"}})
            return False

    def db_update_one(self, filter, operations, after=True, col="active"):
        """
        Update the data into the active db

        :param filter: Which instance to update, e.g., {"id": "xxx"}
        :param operations: data to update to db, e.g., {"$set": {}}
        :param after: return AFTER or BEFORE
        :param col: collection to operate on
        :return: The updated host json dict
        """
        if after:
            return_type = ReturnDocument.AFTER
        else:
            return_type = ReturnDocument.BEFORE
        if col == "active":
            doc = self.col_active.find_one_and_update(
                filter, operations, return_document=return_type)
        else:
            doc = self.col_released.find_one_and_update(
                filter, operations, return_document=return_type)
        return self._serialize(doc)


cluster_handler = ClusterHandler()
