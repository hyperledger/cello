import logging
import os
import sys

from flask import jsonify, Blueprint, render_template
from flask import request as r

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import log_handler, LOG_LEVEL, \
    make_ok_response, make_fail_response, \
    CODE_CREATED, \
    request_debug

from modules import host_handler

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


bp_host_api = Blueprint('bp_host_api', __name__,
                        url_prefix='/{}'.format("api"))


@bp_host_api.route('/host/<host_id>', methods=['GET'])
def host_query(host_id):
    request_debug(r, logger)
    result = host_handler.get_by_id(host_id)
    logger.debug(result)
    if result:
        return make_ok_response(data=result)
    else:
        error_msg = "host not found with id=" + host_id
        logger.warning(error_msg)
        return make_fail_response(error=error_msg, data=r.form)


@bp_host_api.route('/host', methods=['POST'])
def host_create():
    request_debug(r, logger)
    name, daemon_url, capacity, log_type, log_server, log_level = \
        r.form['name'], r.form['daemon_url'], r.form['capacity'], \
        r.form['log_type'], r.form['log_server'], r.form['log_level']

    if "autofill" in r.form and r.form["autofill"] == "on":
        autofill = "true"
    else:
        autofill = "false"

    if "schedulable" in r.form and r.form["schedulable"] == "on":
        schedulable = "true"
    else:
        schedulable = "false"

    logger.debug("name={}, daemon_url={}, capacity={}"
                 "fillup={}, schedulable={}, log={}/{}".
                 format(name, daemon_url, capacity, autofill, schedulable,
                        log_type, log_server))
    if not name or not daemon_url or not capacity or not log_type:
        error_msg = "host POST without enough data"
        logger.warning(error_msg)
        return make_fail_response(error=error_msg, data=r.form)
    else:
        result = host_handler.create(name=name, daemon_url=daemon_url,
                                     capacity=int(capacity),
                                     autofill=autofill,
                                     schedulable=schedulable,
                                     log_level=log_level,
                                     log_type=log_type,
                                     log_server=log_server)
        if result:
            logger.debug("host creation successfully")
            return make_ok_response(code=CODE_CREATED)
        else:
            error_msg = "Failed to create host {}".format(r.form["name"])
            logger.warning(error_msg)
            return make_fail_response(error=error_msg)


@bp_host_api.route('/host', methods=['PUT'])
def host_update():
    request_debug(r, logger)
    if "id" not in r.form:
        error_msg = "host PUT without enough data"
        logger.warning(error_msg)
        return make_fail_response(error=error_msg,
                                  data=r.form)
    else:
        id, d = r.form["id"], {}
        for k in r.form:
            if k != "id":
                d[k] = r.form.get(k)
        result = host_handler.update(id, d)
        if result:
            logger.debug("host PUT successfully")
            return make_ok_response()
        else:
            error_msg = "Failed to update host {}".format(result.get("name"))
            logger.warning(error_msg)
            return make_fail_response(error=error_msg)


@bp_host_api.route('/host', methods=['PUT', 'DELETE'])
def host_delete():
    request_debug(r, logger)
    if "id" not in r.form or not r.form["id"]:
        error_msg = "host delete without enough data"
        logger.warning(error_msg)
        return make_fail_response(error=error_msg, data=r.form)
    else:
        logger.debug("host delete with id={0}".format(r.form["id"]))
        if host_handler.delete(id=r.form["id"]):
            return make_ok_response()
        else:
            error_msg = "Failed to delete host {}".format(r.form["id"])
            logger.warning(error_msg)
            return make_fail_response(error=error_msg)


@bp_host_api.route('/host_op', methods=['POST'])
def host_actions():
    logger.info("/host_op, method=" + r.method)
    request_debug(r, logger)

    host_id, action = r.form['id'], r.form['action']
    if not host_id or not action:
        error_msg = "host POST without enough data"
        logger.warning(error_msg)
        return make_fail_response(error=error_msg,
                                  data=r.form)
    else:
        if action == "fillup":
            if host_handler.fillup(host_id):
                logger.debug("fillup successfully")
                return make_ok_response()
            else:
                error_msg = "Failed to fillup the host."
                logger.warning(error_msg)
                return make_fail_response(error=error_msg, data=r.form)
        elif action == "clean":
            if host_handler.clean(host_id):
                logger.debug("clean successfully")
                return make_ok_response()
            else:
                error_msg = "Failed to clean the host."
                logger.warning(error_msg)
                return make_fail_response(error=error_msg, data=r.form)
        elif action == "reset":
            if host_handler.reset(host_id):
                logger.debug("reset successfully")
                return make_ok_response()
            else:
                error_msg = "Failed to reset the host."
                logger.warning(error_msg)
                return make_fail_response(error=error_msg, data=r.form)

    error_msg = "unknown host action={}".format(action)
    logger.warning(error_msg)
    return make_fail_response(error=error_msg, data=r.form)
