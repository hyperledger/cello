import datetime
import logging
import os
import random
import sys
import time
from threading import Thread

from pymongo.collection import ReturnDocument

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import \
    db, log_handler, \
    LOG_LEVEL, CLUSTER_LOG_TYPES, CLUSTER_LOG_LEVEL, \
    CLUSTER_SIZES, CLUSTER_PORT_START, CLUSTER_PORT_STEP, \
    CONSENSUS_TYPES, HOST_TYPES

from agent import DockerHost, KubernetesHost

from modules import cluster

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


def check_status(func):
    def wrapper(self, *arg):
        if not self.is_active(*arg):
            logger.warning("Host inactive")
            return False
        else:
            return func(self, *arg)
    return wrapper


class HostHandler(object):
    """ Main handler to operate the hosts.

    Host can be platforms like Docker, Swarm or Kubernetes
    """
    def __init__(self):
        self.col = db["host"]
        self.host_agents = {
            'docker': DockerHost(),
            'swarm': DockerHost(),
            'kubernetes': KubernetesHost()
        }

    def create(self, name, daemon_url, capacity=1,
               log_level=CLUSTER_LOG_LEVEL[0],
               log_type=CLUSTER_LOG_TYPES[0], log_server="", autofill="false",
               schedulable="false", serialization=True,
               host_type=HOST_TYPES[0]):
        """ Create a new docker host node

        A docker host is potentially a single node or a swarm.
        Will full fill with clusters of given capacity.

        :param name: name of the node
        :param daemon_url: daemon_url of the host
        :param capacity: The number of clusters to hold
        :param log_type: type of the log
        :param log_level: level of the log
        :param log_server: server addr of the syslog
        :param autofill: Whether automatically fillup with chains
        :param schedulable: Whether can schedule cluster request to it
        :param serialization: whether to get serialized result or object
        :return: True or False
        """
        logger.debug("Create host: name={}, daemon_url={}, capacity={}, "
                     "log={}/{}, autofill={}, schedulable={}"
                     .format(name, daemon_url, capacity, log_type,
                             log_server, autofill, schedulable))
        if not daemon_url.startswith("tcp://"):
            daemon_url = "tcp://" + daemon_url

        if self.col.find_one({"daemon_url": daemon_url}):
            logger.warning("{} already existed in db".format(daemon_url))
            return {}

        if "://" not in log_server:
            log_server = "udp://" + log_server
        if log_type == CLUSTER_LOG_TYPES[0]:
            log_server = ""

        if not self.host_agents[host_type].create(daemon_url):
            logger.warning("{} cannot be setup".format(name))
            return {}

        h = {
            'id': '',
            'name': name,
            'daemon_url': daemon_url,
            'create_ts': datetime.datetime.now(),
            'capacity': capacity,
            'status': 'active',
            'clusters': [],
            'type': host_type,
            'log_level': log_level,
            'log_type': log_type,
            'log_server': log_server,
            'autofill': autofill,
            'schedulable': schedulable
        }
        hid = self.col.insert_one(h).inserted_id  # object type
        host = self.db_update_one(
            {"_id": hid},
            {"$set": {"id": str(hid)}})

        if capacity > 0 and autofill == "true":  # should autofill it
            self.fillup(str(hid))

        if serialization:
            return self._serialize(host)
        else:
            return host

    def get_by_id(self, id):
        """ Get a host

        :param id: id of the doc
        :return: serialized result or obj
        """
        # logger.debug("Get a host with id=" + id)
        ins = self.col.find_one({"id": id})
        if not ins:
            logger.warning("No host found with id=" + id)
            return {}
        return self._serialize(ins)

    def update(self, id, d):
        """ Update a host's property

        TODO: may check when changing host type

        :param id: id of the host
        :param d: dict to use as updated values
        :return: serialized result or obj
        """
        logger.debug("Get a host with id=" + id)
        h_old = self.get_by_id(id)
        if not h_old:
            logger.warning("No host found with id=" + id)
            return {}

        if "daemon_url" in d and not d["daemon_url"].startswith("tcp://"):
            d["daemon_url"] = "tcp://" + d["daemon_url"]

        if "capacity" in d:
            d["capacity"] = int(d["capacity"])
        if d["capacity"] < len(h_old.get("clusters")):
            logger.warning("Cannot set cap smaller than running clusters")
            return {}
        if "log_server" in d and "://" not in d["log_server"]:
            d["log_server"] = "udp://" + d["log_server"]
        if "log_type" in d and d["log_type"] == CLUSTER_LOG_TYPES[0]:
            d["log_server"] = ""
        h_new = self.db_set_by_id(id, **d)
        return self._serialize(h_new)

    def list(self, filter_data={}):
        """ List hosts with given criteria

        :param filter_data: Image with the filter properties
        :return: iteration of serialized doc
        """
        hosts = self.col.find(filter_data)
        return list(map(self._serialize, hosts))

    def delete(self, id, host_type=HOST_TYPES[0]):
        """ Delete a host instance

        :param id: id of the host to delete
        :return:
        """
        logger.debug("Delete a host with id={0}".format(id))

        h = self.get_by_id(id)
        if not h:
            logger.warning("Cannot delete non-existed host")
            return False
        if h.get("clusters", ""):
            logger.warning("There are clusters on that host, cannot delete.")
            return False

        self.host_agents[host_type].delete(h.get("daemon_url"))
        self.col.delete_one({"id": id})
        return True

    @check_status
    def fillup(self, id):
        """
        Fullfil a host with clusters to its capacity limit

        :param id: host id
        :return: True or False
        """
        logger.debug("Try fillup host {}".format(id))
        host = self.get_by_id(id)
        if not host:
            return False
        num_new = host.get("capacity") - len(host.get("clusters"))
        if num_new <= 0:
            logger.warning("host {} already full".format(id))
            return True

        free_ports = cluster.cluster_handler.find_free_start_ports(id, num_new)
        logger.debug("Free_ports = {}".format(free_ports))

        def create_cluster_work(start_port):
            cluster_name = "{}_{}".format(
                host.get("name"),
                int((start_port - CLUSTER_PORT_START) / CLUSTER_PORT_STEP))
            consensus_plugin, consensus_mode = random.choice(CONSENSUS_TYPES)
            cluster_size = random.choice(CLUSTER_SIZES)
            cid = cluster.cluster_handler.create(
                name=cluster_name, host_id=id, start_port=start_port,
                consensus_plugin=consensus_plugin,
                consensus_mode=consensus_mode, size=cluster_size)
            if cid:
                logger.debug("Create cluster {} with id={}".format(
                    cluster_name, cid))
            else:
                logger.warning("Create cluster failed")
        for p in free_ports:
            t = Thread(target=create_cluster_work, args=(p,))
            t.start()
            time.sleep(0.2)

        return True

    @check_status
    def clean(self, id):
        """
        Clean a host's free clusters.

        :param id: host id
        :return: True or False
        """
        logger.debug("clean host with id = {}".format(id))
        host = self.get_by_id(id)
        if not host:
            return False
        if len(host.get("clusters")) <= 0:
            return True

        host = self.db_set_by_id(id, autofill="false")
        schedulable_status = host.get("schedulable")
        if schedulable_status == "true":
            host = self.db_set_by_id(id, schedulable="false")

        for cid in host.get("clusters"):
            t = Thread(target=cluster.cluster_handler.delete, args=(cid,))
            t.start()
            time.sleep(0.2)

        if schedulable_status == "true":
            self.db_set_by_id(id, schedulable=schedulable_status)

        return True

    def reset(self, id):
        """
        Clean a host's free clusters.

        :param id: host id
        :return: True or False
        """
        logger.debug("clean host with id = {}".format(id))
        host = self.get_by_id(id)
        if not host or len(host.get("clusters")) > 0:
            logger.warning("No find resettable host with id ={}".format(id))
            return False
        return self.host_agents[host.get("type")].reset(
            host_type=host.get("type"), daemon_url=host.get("daemon_url"))

    def refresh_status(self, id):
        """
        Refresh the status of the host by detection

        :param host: the host to update status
        :return: Updated host
        """
        host = self.get_by_id(id)
        if not host:
            logger.warning("No host found with id=" + id)
            return False
        if not self.host_agents[host.get("type")]\
                .refresh_status(host.get("daemon_url")):
            logger.warning("Host {} is inactive".format(id))
            self.db_set_by_id(id, status="inactive")
            return False
        else:
            self.db_set_by_id(id, status="active")
            return True

    def is_active(self, host_id):
        """
        Update status of the host

        :param host_id: the id of the host to update status
        :return: Updated host
        """
        host = self.get_by_id(host_id)
        if not host:
            logger.warning("invalid host is given")
            return False
        return host.get("status") == "active"

    def get_active_host_by_id(self, id):
        """
        Check if id exists, and status is active. Otherwise update to inactive.

        :param id: host id
        :return: host or None
        """
        logger.debug("check host with id = {}".format(id))
        host = self.col.find_one({"id": id, "status": "active"})
        if not host:
            logger.warning("No active host found with id=" + id)
            return {}
        return self._serialize(host)

    def _serialize(self, doc, keys=['id', 'name', 'daemon_url', 'capacity',
                                    'type', 'create_ts', 'status', 'autofill',
                                    'schedulable', 'clusters', 'log_level',
                                    'log_type', 'log_server']):
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

    def db_set_by_id(self, id, **kwargs):
        """
        Set the key:value pairs to the data
        :param id: Which host to update
        :param kwargs: kv pairs
        :return: The updated host json dict
        """
        return self.db_update_one({"id": id}, {"$set": kwargs})

    def db_update_one(self, filter, operations, after=True):
        """
        Update the data into the active db

        :param filter: Which instance to update, e.g., {"id": "xxx"}
        :param operations: data to update to db, e.g., {"$set": {}}
        :param after: return AFTER or BEFORE
        :return: The updated host json dict
        """
        if after:
            return_type = ReturnDocument.AFTER
        else:
            return_type = ReturnDocument.BEFORE
        doc = self.col.find_one_and_update(
            filter, operations, return_document=return_type)
        return self._serialize(doc)


host_handler = HostHandler()
