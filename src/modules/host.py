
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import datetime
import logging
import os
import random
import sys
import time
from threading import Thread
from uuid import uuid4

from pymongo.collection import ReturnDocument

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import \
    log_handler, \
    FabricV1NetworkConfig, utils, \
    LOG_LEVEL, CLUSTER_LOG_TYPES, CLUSTER_LOG_LEVEL, \
    NETWORK_SIZE_FABRIC_V1, \
    CLUSTER_PORT_START, CLUSTER_PORT_STEP, \
    CONSENSUS_PLUGINS_FABRIC_V1, CONSENSUS_PLUGIN_SOLO, \
    WORKER_TYPES, VCENTER, VCUSERNAME, VCPWD, \
    VMNAME, VMMEMORY, VMCPU, VMNETMASK, VMGATEWAY, TEMPLATE, VMIP, \
    VIRTUAL_MACHINE, VCIP, VCPORT, VMDNS, NETWORK, VMUUID,\
    VC_DATACENTER, VC_DATASTORE, VC_CLUSTER, \
    WORKER_TYPE_DOCKER, WORKER_TYPE_SWARM, WORKER_TYPE_VSPHERE, \
    WORKER_TYPE_K8S, HOST_STATUS, HOST_STATUS_PENDING

from agent import DockerHost, VsphereHost, KubernetesHost
from modules import cluster
from modules.models import Host as HostModel
from modules.models import Cluster as ClusterModel
from modules.models import HostSchema

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

    A host can be a worker like Docker host, Swarm or Kubernetes
    """
    def __init__(self):
        self.host_agents = {
            'docker': DockerHost("docker"),
            'swarm': DockerHost("swarm"),
            'kubernetes': KubernetesHost(),
            'vsphere': VsphereHost()
        }

    def create(self, name, worker_api, host_type, capacity=1,
               log_level=CLUSTER_LOG_LEVEL[0],
               log_type=CLUSTER_LOG_TYPES[0], log_server="", autofill="false",
               schedulable="false", params=None):
        """ Create a new docker host node

        A docker host is potentially a single node or a swarm.
        Will full fill with clusters of given capacity.

        :param name: name of the node
        :param worker_api: worker_api of the host
        :param host_type: docker host type docker or swarm
        :param capacity: The number of clusters to hold
        :param log_type: type of the log
        :param log_level: level of the log
        :param log_server: server addr of the syslog
        :param autofill: Whether automatically fillup with chains
        :param schedulable: Whether can schedule cluster request to it
        :param serialization: whether to get serialized result or object
        :param params: extra data for vSphere host type
        :return: True or False
        """
        logger.debug("Create host: name={}, worker_api={}, host_type={}, "
                     "capacity={}, log={}/{}, autofill={}, schedulable={}"
                     .format(name, worker_api, host_type, capacity, log_type,
                             log_server, autofill, schedulable))

        if params is None and not worker_api.startswith("tcp://"):
            # params is None when host_type is either docker or swarm.
            worker_api = "tcp://" + worker_api

        if HostModel.objects(worker_api=worker_api).count():
            logger.warning("{} already existed in db".format(worker_api))
            return {}

        if "://" not in log_server:
            log_server = "udp://" + log_server
        if log_type == CLUSTER_LOG_TYPES[0]:
            log_server = ""

        if not host_type:
            logger.warning("Host {} cannot be setup".format(name))
            return {}

        hid = uuid4().hex
        host = HostModel(id=hid,
                         name=name,
                         worker_api=worker_api,
                         capacity=capacity,
                         type=host_type,
                         log_level=log_level,
                         log_type=log_type,
                         log_server=log_server,
                         autofill=autofill == "true",
                         schedulable=schedulable == "true"
                         )

        if (host_type == WORKER_TYPE_DOCKER or
           host_type == WORKER_TYPE_SWARM):
            if not self.host_agents[host_type].create(worker_api):
                logger.warning("Host {} cannot be setup".format(name))
                return {}

        if host_type == WORKER_TYPE_VSPHERE:

            vc = params.get(VCENTER)
            vm = params.get(VIRTUAL_MACHINE)

            vc_ip = vc.get(VCIP)
            vc_username = vc.get(VCUSERNAME)
            vc_passwd = vc.get(VCPWD)
            vc_port = vc.get(VCPORT)

            h_update = {
                VMNAME: vm.get(VMNAME),
                VMMEMORY: vm.get(VMMEMORY),
                VMCPU: vm.get(VMCPU),
                VMIP: vm.get(VMIP),
                VMNETMASK: vm.get(VMNETMASK),
                VMDNS: vm.get(VMDNS),
                VMGATEWAY: vm.get(VMGATEWAY),
                TEMPLATE: vc.get(TEMPLATE),
                VC_DATACENTER: vc.get(VC_DATACENTER),
                VC_CLUSTER: vc.get(VC_CLUSTER),
                VC_DATASTORE: vc.get(VC_DATASTORE),
                NETWORK: vc.get(NETWORK),
                VCUSERNAME: vc_username,
                VCPWD: vc_passwd,
                VCPORT: vc_port,
                HOST_STATUS: HOST_STATUS_PENDING
            }
            logger.debug("update {}".format(h_update))
            host.status = HOST_STATUS_PENDING
            try:
                if self.host_agents[host_type].create(vc_ip,
                                                      vc_username,
                                                      vc_passwd, vc_port,
                                                      params, hid):
                    logger.info("Creating vSphere host{}".format(name))

            except Exception as e:  # Catch failure while connecting to vc.
                logger.error("Host {} cannot be setup".format(name))
                logger.error("{}".format(e))
                return {"msg": "{}".format(e)}

        if host_type == WORKER_TYPE_K8S:
            try:
                if self.host_agents[host_type].create(params):
                    logger.info("Successfully created Kubernetes \
                                 host{}".format(name))
            except Exception as e:
                logger.error("Failed to setup Host {}".format(name))
                logger.error("{}".format(e))
                return {"msg": "{}".format(e)}
            logger.debug("Storing K8S data")
            host.k8s_param = params

        host.save()

        if capacity > 0 and autofill == "true":  # should autofill it
            self.fillup(str(hid))

        return self._schema(host)

    def get_by_id(self, id):
        """ Get a host

        :param id: id of the doc
        :return: serialized result or obj
        """
        try:
            ins = HostModel.objects.get(id=id)
        except Exception:
            logger.warning("No host found with id=" + id)
            return None

        return ins

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

        if h_old.status == "pending":
            return {}

        if "worker_api" in d and not d["worker_api"].startswith("tcp://"):
            d["worker_api"] = "tcp://" + d["worker_api"]

        if "capacity" in d:
            d["capacity"] = int(d["capacity"])
        if d["capacity"] < ClusterModel.objects(host=h_old).count():
            logger.warning("Cannot set cap smaller than running clusters")
            return {}
        if "log_server" in d and "://" not in d["log_server"]:
            d["log_server"] = "udp://" + d["log_server"]
        if "log_type" in d and d["log_type"] == CLUSTER_LOG_TYPES[0]:
            d["log_server"] = ""
        if "autofill" in d:
            d["autofill"] = d["autofill"] == "true"
        if "schedulable" in d:
            d["schedulable"] = d["schedulable"] == "true"
        self.db_set_by_id(id, **d)
        h_new = self.get_by_id(id)
        return self._schema(h_new)

    def list(self, filter_data={}):
        """ List hosts with given criteria

        :param filter_data: Image with the filter properties
        :return: iteration of serialized doc
        """
        logger.info("filter data {}".format(filter_data))
        hosts = HostModel.objects(__raw__=filter_data)
        return self._schema(hosts, many=True)

    def delete(self, id):
        """ Delete a host instance

        :param id: id of the host to delete
        :return:
        """
        logger.debug("Delete a host with id={0}".format(id))

        try:
            h = HostModel.objects.get(id=id)
        except Exception:
            logger.warning("Cannot delete non-existed host")
            return False

        host_type = h.type

        if ClusterModel.objects(host=h).count():
            logger.warning("Host type not found.")
            return False

        elif (host_type == WORKER_TYPE_DOCKER or
              host_type == WORKER_TYPE_SWARM):
            self.host_agents[host_type].delete(h.worker_api)

        elif host_type == WORKER_TYPE_VSPHERE:
            if h.status == "pending":
                return False
            vmuuid = h.vcparam[utils.VMUUID]
            vcip = h.vcparam[utils.VCIP]
            vcusername = h.vcparam[utils.VCUSERNAME]
            vcpwd = h.vcparam[utils.VCPWD]
            vcport = h.vcparam[utils.VCPORT]
            self.host_agents[host_type].delete(vmuuid,
                                               vcip,
                                               vcusername,
                                               vcpwd,
                                               vcport)
        h.delete()
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
        if host.status != "active":
            logger.warning("host {} is not active".format(id))
            return False
        clusters = ClusterModel.objects(host=host)
        num_new = host.capacity - len(clusters)
        if num_new <= 0:
            logger.warning("host {} already full".format(id))
            return True

        free_ports = cluster.cluster_handler.find_free_start_ports(id, num_new)
        logger.debug("Free_ports = {}".format(free_ports))

        def create_cluster_work(start_port):
            cluster_name = "{}_{}".format(
                host.name,
                int((start_port - CLUSTER_PORT_START) / CLUSTER_PORT_STEP))
            cluster_size = random.choice(NETWORK_SIZE_FABRIC_V1)
            config = FabricV1NetworkConfig(
                consensus_plugin=CONSENSUS_PLUGIN_SOLO,
                size=cluster_size)
            cid = cluster.cluster_handler.create(name=cluster_name,
                                                 host_id=id, config=config,
                                                 start_port=start_port)
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
        clusters = ClusterModel.objects(host=host)
        if host.status != "active":
            return False

        if len(clusters) <= 0:
            return True

        host = self.db_set_by_id(id, **{"autofill": False})
        schedulable_status = host.schedulable
        if schedulable_status:
            host = self.db_set_by_id(id, **{"schedulable": False})

        for cluster_item in clusters:
            cid = str(cluster_item.id)
            t = Thread(target=cluster.cluster_handler.delete, args=(cid,))
            t.start()
            time.sleep(0.2)

        if schedulable_status:
            self.db_set_by_id(id, **{"schedulable": schedulable_status})

        return True

    def reset(self, id):
        """
        Clean a host's free clusters.

        :param id: host id
        :return: True or False
        """
        logger.debug("clean host with id = {}".format(id))
        host = self.get_by_id(id)
        if not host or ClusterModel.objects(host=host).count() < 0:
            logger.warning("No find resettable host with id ={}".format(id))
            return False
        host_type = host.type
        return self.host_agents[host_type].reset(host_type, host.worker_api)

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
        if not self.host_agents[host.type]\
                .refresh_status(host.worker_api):
            logger.warning("Host {} is inactive".format(id))
            self.db_set_by_id(id, **{"status": "inactive"})
            return False
        else:
            self.db_set_by_id(id, **{"status": "active"})
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
        return host.status == "active"

    def get_active_host_by_id(self, id):
        """
        Check if id exists, and status is active. Otherwise update to inactive.

        :param id: host id
        :return: host or None
        """
        logger.debug("check host with id = {}".format(id))
        try:
            host = HostModel.objects.get(id=id)
        except Exception:
            logger.warning("No active host found with id=" + id)
            return None
        return host

    def _serialize(self, doc, keys=['id', 'name', 'worker_api', 'capacity',
                                    'type', 'create_ts', 'status', 'autofill',
                                    'schedulable', 'log_level',
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

    def _schema(self, doc, many=False):
        host_schema = HostSchema(many=many)
        return host_schema.dump(doc).data

    def schema(self, doc, many=False):
        return self._schema(doc, many)

    def db_set_by_id(self, id, **kwargs):
        """
        Set the key:value pairs to the data
        :param id: Which host to update
        :param kwargs: kv pairs
        :return: The updated host json dict
        """
        kwargs = dict(('set__' + k, v)
                      for (k, v) in locals().get("kwargs", {}).items())
        HostModel.objects(id=id).update(
            upsert=True,
            **kwargs
        )

        return HostModel.objects.get(id=id)


host_handler = HostHandler()
