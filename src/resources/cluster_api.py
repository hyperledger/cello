import logging
import os
import sys

from flask import Blueprint, render_template
from flask import request as r

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import log_handler, LOG_LEVEL, \
    request_get, make_ok_response, make_fail_response, \
    request_debug, request_json_body, \
    CODE_CREATED, CODE_NOT_FOUND, \
    CONSENSUS_PLUGINS, CONSENSUS_MODES, CLUSTER_SIZES
from modules import cluster_handler, host_handler

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


bp_cluster_api = Blueprint('bp_cluster_api', __name__,
                           url_prefix='/{}'.format("api"))

front_rest_v2 = Blueprint('front_rest_v2', __name__,
                          url_prefix='/{}'.format("v2"))


def cluster_start(r):
    """Start a cluster which should be in stopped status currently.

    :param r:
    :return:
    """
    cluster_id = request_get(r, "cluster_id")
    if not cluster_id:
        logger.warning("No cluster_id is given")
        return make_fail_response("No cluster_id is given")
    if cluster_handler.start(cluster_id):
        return make_ok_response()

    return make_fail_response("cluster start failed")


def cluster_restart(r):
    """Start a cluster which should be in stopped status currently.

    :param r:
    :return:
    """
    cluster_id = request_get(r, "cluster_id")
    if not cluster_id:
        logger.warning("No cluster_id is given")
        return make_fail_response("No cluster_id is given")
    if cluster_handler.restart(cluster_id):
        return make_ok_response()

    return make_fail_response("cluster restart failed")


def cluster_stop(r):
    """Stop a cluster which should be in running status currently.

    :param r:
    :return:
    """
    cluster_id = request_get(r, "cluster_id")
    if not cluster_id:
        logger.warning("No cluster_id is given")
        return make_fail_response("No cluster_id is given")
    if cluster_handler.stop(cluster_id):
        return make_ok_response()

    return make_fail_response("cluster stop failed")


def cluster_apply(r):
    """Apply a cluster.

    Return a Cluster json body.
    """
    request_debug(r, logger)

    user_id = request_get(r, "user_id")
    if not user_id:
        logger.warning("cluster_apply without user_id")
        return make_fail_response("cluster_apply without user_id")

    allow_multiple, condition = request_get(r, "allow_multiple"), {}

    consensus_plugin = request_get(r, "consensus_plugin")
    consensus_mode = request_get(r, "consensus_mode")
    cluster_size = int(request_get(r, "size") or -1)
    if consensus_plugin:
        if consensus_plugin not in CONSENSUS_PLUGINS:
            logger.warning("Invalid consensus_plugin")
            return make_fail_response("Invalid consensus_plugin")
        else:
            condition["consensus_plugin"] = consensus_plugin

    if consensus_mode:
        if consensus_mode not in CONSENSUS_MODES:
            logger.warning("Invalid consensus_mode")
            return make_fail_response("Invalid consensus_mode")
        else:
            condition["consensus_mode"] = consensus_mode

    if cluster_size >= 0:
        if cluster_size not in CLUSTER_SIZES:
            logger.warning("Invalid cluster_size")
            return make_fail_response("Invalid cluster_size")
        else:
            condition["size"] = cluster_size

    logger.debug("condition={}".format(condition))
    c = cluster_handler.apply_cluster(user_id=user_id, condition=condition,
                                      allow_multiple=allow_multiple)
    if not c:
        logger.warning("cluster_apply failed")
        return make_fail_response("No available res for {}".format(user_id))
    else:
        return make_ok_response(data=c)


def cluster_release(r):
    """Release a cluster which should be in used status currently.

    :param r:
    :return:
    """
    cluster_id = request_get(r, "cluster_id")
    if not cluster_id:
        logger.warning("No cluster_id is given")
        return make_fail_response("No cluster_id is given")
    if cluster_handler.release_cluster(cluster_id):
        return make_ok_response()

    return make_fail_response("cluster release failed")


@front_rest_v2.route('/cluster_op', methods=['GET', 'POST'])
@bp_cluster_api.route('/cluster_op', methods=['GET', 'POST'])
def cluster_actions():
    """Issue some operations on the cluster.
    Valid operations include: apply, release, start, stop, restart
    e.g.,
    apply a cluster for user: GET /cluster_op?action=apply&user_id=xxx
    release a cluster: GET /cluster_op?action=release&cluster_id=xxx
    start a cluster: GET /cluster_op?action=start&cluster_id=xxx
    stop a cluster: GET /cluster_op?action=stop&cluster_id=xxx
    restart a cluster: GET /cluster_op?action=restart&cluster_id=xxx

    Return a json obj.
    """
    request_debug(r, logger)
    action = request_get(r, "action")
    logger.info("cluster_op with action={}".format(action))
    if action == "apply":
        return cluster_apply(r)
    elif action == "release":
        return cluster_release(r)
    elif action == "start":
        return cluster_start(r)
    elif action == "stop":
        return cluster_stop(r)
    elif action == "restart":
        return cluster_restart(r)
    else:
        return make_fail_response(error="Unknown action type")


@bp_cluster_api.route('/cluster/<cluster_id>', methods=['GET'])
@front_rest_v2.route('/cluster/<cluster_id>', methods=['GET'])
def cluster_query(cluster_id):
    """Query a json obj of a cluster

    GET /cluster/xxxx

    Return a json obj of the cluster.
    """
    request_debug(r, logger)
    result = cluster_handler.get_by_id(cluster_id)
    logger.info(result)
    if result:
        return make_ok_response(data=result)
    else:
        error_msg = "cluster not found with id=" + cluster_id
        logger.warning(error_msg)
        return make_fail_response(error=error_msg, data=r.form,
                                  code=CODE_NOT_FOUND)


@bp_cluster_api.route('/cluster', methods=['POST'])
def cluster_create():
    """Create a cluster on a host

    POST /cluster
    {
    name: xxx,
    host_id: xxx,
    consensus_plugin: pbft,
    consensus_mode: batch,
    size: 4,
    }

    :return: response object
    """
    logger.info("/cluster action=" + r.method)
    request_debug(r, logger)
    if not r.form["name"] or not r.form["host_id"] or not \
            r.form["consensus_plugin"] or not r.form["size"]:
        error_msg = "cluster post without enough data"
        logger.warning(error_msg)
        return make_fail_response(error=error_msg, data=r.form)
    else:
        name, host_id, consensus_plugin, consensus_mode, size = \
            r.form['name'], r.form['host_id'], r.form['consensus_plugin'],\
            r.form['consensus_mode'] or '', int(r.form[
                "size"])
        if consensus_plugin not in CONSENSUS_PLUGINS:
            logger.debug("Unknown consensus_plugin={}".format(
                consensus_plugin))
            return make_fail_response()
        if consensus_plugin != CONSENSUS_PLUGINS[0] and consensus_mode \
                not in CONSENSUS_MODES:
            logger.debug("Invalid consensus, plugin={}, mode={}".format(
                consensus_plugin, consensus_mode))
            return make_fail_response()

        if size not in CLUSTER_SIZES:
            logger.debug("Unknown cluster size={}".format(size))
            return make_fail_response()
        if cluster_handler.create(name=name, host_id=host_id,
                                  consensus_plugin=consensus_plugin,
                                  consensus_mode=consensus_mode,
                                  size=size):
            logger.debug("cluster POST successfully")
            return make_ok_response(code=CODE_CREATED)
        else:
            logger.debug("cluster creation failed")
            return make_fail_response(error="Failed to create cluster {}".
                                      format(name))


@bp_cluster_api.route('/cluster', methods=['DELETE'])
def cluster_delete():
    """Delete a cluster

    DELETE /cluster
    {
        id: xxx
        col_name: active
    }

    :return: response obj
    """
    logger.info("/cluster action=" + r.method)
    request_data = r.get_json(force=True, silent=True)
    if r.form:
        cluster_id = r.form["id"]
        col_name = r.form["col_name"]
    else:
        cluster_id = request_data.get("id")
        col_name = request_data.get("col_name")
    request_debug(r, logger)
    if not cluster_id or not col_name:
        error_msg = "cluster operation post without enough data"
        logger.warning(error_msg)
        return make_fail_response(error=error_msg, data=r.form)
    else:
        logger.debug("cluster delete with id={0}, col_name={1}".format(
            cluster_id, col_name))
        if col_name == "active":
            result = cluster_handler.delete(id=cluster_id)
        else:
            result = cluster_handler.delete_released(id=cluster_id)
        if result:
            return make_ok_response()
        else:
            error_msg = "Failed to delete cluster {}".format(cluster_id)
            logger.warning(error_msg)
            return make_fail_response(error=error_msg)


@bp_cluster_api.route('/clusters', methods=['GET', 'POST'])
@front_rest_v2.route('/clusters', methods=['GET', 'POST'])
def cluster_list():
    """List clusters with the filter
    e.g.,

    GET /clusters?consensus_plugin=pbft

    Return objs of the clusters.
    """
    request_debug(r, logger)
    f = {}
    if r.method == 'GET':
        f.update(r.args.to_dict())
    elif r.method == 'POST':
        f.update(request_json_body(r))
    logger.info(f)
    result = cluster_handler.list(filter_data=f)
    logger.error(result)
    return make_ok_response(data=result)


# will deprecate
@front_rest_v2.route('/cluster_apply', methods=['GET', 'POST'])
def cluster_apply_dep():
    """
    Return a Cluster json body.
    """
    request_debug(r, logger)

    user_id = request_get(r, "user_id")
    if not user_id:
        error_msg = "cluster_apply without user_id"
        logger.warning(error_msg)
        return make_fail_response(error=error_msg)

    allow_multiple, condition = request_get(r, "allow_multiple"), {}

    consensus_plugin = request_get(r, "consensus_plugin")
    consensus_mode = request_get(r, "consensus_mode")
    cluster_size = int(request_get(r, "size") or -1)
    if consensus_plugin:
        if consensus_plugin not in CONSENSUS_PLUGINS:
            error_msg = "Invalid consensus_plugin"
            logger.warning(error_msg)
            return make_fail_response(error=error_msg)
        else:
            condition["consensus_plugin"] = consensus_plugin

    if consensus_mode:
        if consensus_mode not in CONSENSUS_MODES:
            error_msg = "Invalid consensus_mode"
            logger.warning(error_msg)
            return make_fail_response(error=error_msg)
        else:
            condition["consensus_mode"] = consensus_mode

    if cluster_size >= 0:
        if cluster_size not in CLUSTER_SIZES:
            error_msg = "Invalid cluster_size"
            logger.warning(error_msg)
            return make_fail_response(error=error_msg)
        else:
            condition["size"] = cluster_size

    logger.debug("condition={}".format(condition))
    c = cluster_handler.apply_cluster(user_id=user_id, condition=condition,
                                      allow_multiple=allow_multiple)
    if not c:
        error_msg = "No available res for {}".format(user_id)
        logger.warning(error_msg)
        return make_fail_response(error=error_msg)
    else:
        return make_ok_response(data=c)


# will deprecate
@front_rest_v2.route('/cluster_release', methods=['GET', 'POST'])
def cluster_release_dep():
    """
    Return status.
    """
    request_debug(r, logger)
    user_id = request_get(r, "user_id")
    cluster_id = request_get(r, "cluster_id")
    if not user_id and not cluster_id:
        error_msg = "cluster_release without id"
        logger.warning(error_msg)
        return make_fail_response(error=error_msg, data=r.args)
    else:
        result = None
        if cluster_id:
            result = cluster_handler.release_cluster(cluster_id=cluster_id)
        elif user_id:
            result = cluster_handler.release_cluster_for_user(user_id=user_id)
        if not result:
            error_msg = "cluster_release failed user_id={} cluster_id={}". \
                format(user_id, cluster_id)
            logger.warning(error_msg)
            data = {
                "user_id": user_id,
                "cluster_id": cluster_id,
            }
            return make_fail_response(error=error_msg, data=data)
        else:
            return make_ok_response()
