# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import json
import os

CLUSTER_NETWORK = "cello_net"

NETWORK_SIZE_FABRIC_PRE_V1 = [4, 6]
NETWORK_SIZE_FABRIC_V1 = [4]

# first port that can be assigned as cluster API
CLUSTER_PORT_START = int(os.getenv("CLUSTER_PORT_START", 7050))

# number of port allocated to each cluster in case collision
CLUSTER_PORT_STEP = 100

PEER_SERVICE_PORTS = {
    'rest': 7050,  # this is the reference starter for cluster port step
    'grpc': 7051,
    'cli': 7052,
    'event': 7053,
}

CA_SERVICE_PORTS = {
    'ecap': 7054,
    'ecaa': 7055,
    'tcap': 7056,
    'tcaa': 7057,
    'tlscap': 7058,
    'tlscaa': 7059,
}

SERVICE_PORTS = dict(list(PEER_SERVICE_PORTS.items()) +
                     list(CA_SERVICE_PORTS.items()))

NETWORK_TYPE_FABRIC_PRE_V1 = 'fabric-0.6'
NETWORK_TYPE_FABRIC_V1 = 'fabric-1.0'
NETWORK_TYPES = [NETWORK_TYPE_FABRIC_V1, NETWORK_TYPE_FABRIC_PRE_V1]

CONSENSUS_PLUGIN_NOOPS = 'noops'
CONSENSUS_PLUGIN_PBFT = 'pbft'
CONSENSUS_PLUGIN_SOLO = 'solo'
CONSENSUS_PLUGIN_KAFKA = 'kafka'

CONSENSUS_PLUGINS_FABRIC_V1 = [CONSENSUS_PLUGIN_SOLO, CONSENSUS_PLUGIN_KAFKA]

CONSENSUS_PLUGINS_FABRIC_PRE_V1 = [CONSENSUS_PLUGIN_NOOPS,
                                   CONSENSUS_PLUGIN_PBFT]

# CONSENSUS_MODES = ['classic', 'batch', 'sieve']  # pbft has various modes
CONSENSUS_MODE_BATCH = 'batch'
CONSENSUS_MODES = [CONSENSUS_MODE_BATCH]  # pbft has various modes

CONSENSUS_TYPES_FABRIC_PRE_V1 = [
    (CONSENSUS_PLUGIN_NOOPS, ''),
    (CONSENSUS_PLUGIN_PBFT, CONSENSUS_MODE_BATCH),
]

CONSENSUS_TYPES_FABRIC_V1 = [
    (CONSENSUS_PLUGIN_SOLO, ''),
    (CONSENSUS_PLUGIN_KAFKA, '')
]

WORKER_TYPE_DOCKER = 'docker'
WORKER_TYPE_SWARM = 'swarm'
WORKER_TYPE_K8S = 'kubernetes'
WORKER_TYPE_VSPHERE = 'vsphere'
WORKER_TYPES = [WORKER_TYPE_DOCKER, WORKER_TYPE_SWARM, WORKER_TYPE_K8S,
                WORKER_TYPE_VSPHERE]

# TODO: might deprecate as can use agent to collect log seperately
CLUSTER_LOG_TYPES = ['local', 'syslog']
CLUSTER_LOG_LEVEL = ['DEBUG', 'INFO', 'NOTICE', 'WARNING', 'ERROR',
                     'CRITICAL']

SYS_USER = "__SYSTEM__"
SYS_CREATOR = SYS_USER + "CREATING"
SYS_DELETER = SYS_USER + "DELETING"
SYS_RESETTING = SYS_USER + "RESETTING"

# Vcenter and VirtualMachine Confs
VIRTUAL_MACHINE = 'vm'
VCENTER = 'vc'
VMUUID = 'vm_uuid'
VM_DEFAULT_HOSTNAME = "Cello"
VMMEMORY = 'memory'
VMCPU = 'vcpus'
VMNAME = 'vmname'
VMIP = 'ip'
VMNETMASK = 'netmask'
VMDNS = 'dns'
VMGATEWAY = 'gateway'
TEMPLATE = 'template'
VC_DATACENTER = 'vc_datacenter'
VC_CLUSTER = 'vc_cluster'
VC_DATASTORE = 'vc_datastore'
NETWORK = 'network'
NIC_DEVICE_ADDRESS_TYPE = 'assigned'
VCIP = 'address'
VCUSERNAME = 'username'
VCPWD = 'password'
VCPORT = 'port'
VC_DEFAULT_PORT = 443
VCTHREAD_NAME = "setupvm"
WORKER_API_PORT = 2375
DEFAULT_TIMEOUT = 300


def json_decode(jsonstr):
    try:
        json_object = json.loads(jsonstr)
    except json.decoder.JSONDecodeError as e:
        print(e)
        return jsonstr
    return json_object


def request_debug(request, logger):
    logger.debug("path={}, method={}".format(request.path, request.method))
    logger.debug("request args:")
    for k in request.args:
        logger.debug("Arg: {0}:{1}".format(k, request.args[k]))
    logger.debug("request form:")
    for k in request.form:
        logger.debug("Form: {0}:{1}".format(k, request.form[k]))
    logger.debug("request raw body data:")
    logger.debug(request.data)
    logger.debug(request.get_json(force=True, silent=True))


def request_get(request, key, default_value=None):
    if key in request.args:
        return request.args.get(key)
    elif key in request.form:
        return request.form.get(key)
    try:
        json_body = request.get_json(force=True, silent=True)
        if key in json_body:
            return json_body[key]
        else:
            return default_value
    except Exception:
        return default_value


def request_json_body(request, default_value={}):
    try:
        json_body = request.get_json(force=True, silent=True)
        return json_body
    except Exception:
        return default_value
