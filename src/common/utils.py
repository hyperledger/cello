import json
import os


CLUSTER_NETWORK = "cello_net"
CLUSTER_SIZES = [4, 6]

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


CONSENSUS_PLUGINS = ['noops', 'pbft']  # first one is the default one
# CONSENSUS_MODES = ['classic', 'batch', 'sieve']  # pbft has various modes
CONSENSUS_MODES = ['batch']  # pbft has various modes

CONSENSUS_TYPES = [
    ('noops', ''),
    ('pbft', 'batch'),
    # ('pbft', 'classic'),
    # ('pbft', 'sieve'),
]


HOST_TYPES = ['docker', 'swarm', 'kubernetes']  # all supported host types

CLUSTER_LOG_TYPES = ['local', 'syslog']

CLUSTER_LOG_LEVEL = ['DEBUG', 'INFO', 'NOTICE', 'WARNING', 'ERROR',
                     'CRITICAL']

SYS_USER = "__SYSTEM__"
SYS_CREATOR = SYS_USER + "CREATING"
SYS_DELETER = SYS_USER + "DELETING"
SYS_RESETTING = SYS_USER + "RESETTING"


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
