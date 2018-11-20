
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import os
import sys
import uuid

from flask import jsonify, Blueprint, render_template
from flask import request as r
import json

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import log_handler, LOG_LEVEL, \
    make_ok_resp, make_fail_resp, \
    CODE_CREATED, \
    request_debug

from common.utils import K8S_CRED_TYPE

from modules import host_handler
from modules.models import Cluster as ClusterModel
from modules.models import Host as HostModel
from agent import detect_daemon_type
from auth import oidc

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


bp_host_api = Blueprint('bp_host_api', __name__,
                        url_prefix='/{}'.format("api"))


@bp_host_api.route('/hosts', methods=['GET'])
@oidc.accept_token(True)
def hosts_list():
    logger.info("/hosts_list method=" + r.method)
    request_debug(r, logger)
    col_filter = dict((key, r.args.get(key)) for key in r.args)
    items = list(host_handler.list(filter_data=col_filter))

    return make_ok_resp(data=items)


@bp_host_api.route('/host/<host_id>', methods=['GET'])
def host_query(host_id):
    request_debug(r, logger)
    result = host_handler.schema(host_handler.get_by_id(host_id))
    logger.debug(result)
    if result:
        return make_ok_resp(data=result)
    else:
        error_msg = "host not found with id=" + host_id
        logger.warning(error_msg)
        return make_fail_resp(error=error_msg, data=r.form)


@bp_host_api.route('/host', methods=['POST'])
def host_create():
    request_debug(r, logger)
    if r.content_type.startswith("application/json"):
        body = dict(r.get_json(force=True, silent=True))
    else:
        body = r.form
    name, worker_api, capacity, log_type, log_server, log_level, host_type = \
        body['name'], body['worker_api'], body['capacity'], \
        body['log_type'], body.get('log_server', ''), body['log_level'], \
        body['host_type'] if 'host_type' in body else None

    if "autofill" in body and body["autofill"] == "on":
        autofill = "true"
    else:
        autofill = "false"

    if "schedulable" in body and body["schedulable"] == "on":
        schedulable = "true"
    else:
        schedulable = "false"

    if host_type == "vsphere":
        vcaddress = body['vc_address']
        if vcaddress.find(":") == -1:
            address = vcaddress
            port = "443"
        else:
            address = vcaddress.split(':')[0]
            port = vcaddress.split(':')[1]
        logger.debug("address={}, port={}".format(address, port))

        vmname = "cello-vsphere-" + str(uuid.uuid1())
        vsphere_param = {
            'vc': {
                'address': address,
                'port': port,
                'username': body['vc_user'],
                'password': body['vc_password'],
                'network': body['vc_network'],
                'vc_datastore': body['datastore'],
                'vc_datacenter': body['datacenter'],
                'vc_cluster': body['cluster'],
                'template': body['vm_template']},
            'vm': {
                'vmname': vmname,
                'ip': body['vm_ip'],
                'gateway': body['vm_gateway'],
                'netmask': body['vm_netmask'],
                'dns': body['vm_dns'],
                'vcpus': int(body['vm_cpus']),
                'memory': int(body['vm_memory'])}}

        logger.debug("name={}, capacity={},"
                     "fillup={}, schedulable={}, log={}/{}, vsphere_param={}".
                     format(name, capacity, autofill, schedulable,
                            log_type, log_server, vsphere_param))

        vsphere_must_have_params = {
            'Name': name,
            'Capacity': capacity,
            'LoggingType': log_type,
            'VCAddress': address,
            'VCUser': body['vc_user'],
            'VCPassword': body['vc_password'],
            'VCNetwork': body['vc_network'],
            'Datastore': body['datastore'],
            'Datacenter': body['datacenter'],
            'Cluster': body['cluster'],
            'VMIp': body['vm_ip'],
            'VMGateway': body['vm_gateway'],
            'VMNetmask': body['vm_netmask']}
        for key in vsphere_must_have_params:
            if vsphere_must_have_params[key] == '':
                error_msg = "host POST without {} data".format(key)
                logger.warning(error_msg)
                return make_fail_resp(error=error_msg, data=body)
        result = host_handler.create(name=name, worker_api=worker_api,
                                     capacity=int(capacity),
                                     autofill=autofill,
                                     schedulable=schedulable,
                                     log_level=log_level,
                                     log_type=log_type,
                                     log_server=log_server,
                                     host_type=host_type,
                                     params=vsphere_param)

    elif host_type == 'kubernetes':
        worker_api = body['worker_api']
        k8s_param = create_k8s_host(name, capacity, log_type, body)
        if len(k8s_param) == 0:
            return make_fail_resp(error=error_msg, data=r.form)

        logger.debug("name={}, worker_api={},  capacity={},"
                     "fillup={}, schedulable={}, log={}/{}, k8s_param={}".
                     format(name, worker_api, capacity, autofill,
                            schedulable, log_type, log_server, k8s_param))

        result = host_handler.create(name=name, worker_api=worker_api,
                                     capacity=int(capacity),
                                     autofill=autofill,
                                     schedulable=schedulable,
                                     log_level=log_level,
                                     log_type=log_type,
                                     log_server=log_server,
                                     host_type=host_type,
                                     params=k8s_param)

    else:
        logger.debug("name={}, worker_api={}, capacity={}"
                     "fillup={}, schedulable={}, log={}/{}".
                     format(name, worker_api, capacity, autofill, schedulable,
                            log_type, log_server))
        if not name or not worker_api or not capacity or not log_type:
            error_msg = "host POST without enough data"
            logger.warning(error_msg)
            return make_fail_resp(error=error_msg, data=body)
        else:
            host_type = host_type if host_type \
                else detect_daemon_type(worker_api)
            result = host_handler.create(name=name, worker_api=worker_api,
                                         capacity=int(capacity),
                                         autofill=autofill,
                                         schedulable=schedulable,
                                         log_level=log_level,
                                         log_type=log_type,
                                         log_server=log_server,
                                         host_type=host_type)
    logger.debug("result.msg={}".format(result.get('msg')))
    if (host_type == "vsphere") and ('msg' in result):
        vsphere_errmsg = result.get('msg')
        error_msg = "Failed to create vsphere host {}".format(vsphere_errmsg)
        logger.warning(error_msg)
        return make_fail_resp(error=error_msg)
    elif result:
        logger.debug("host creation successfully")
        return make_ok_resp(code=CODE_CREATED)
    else:
        error_msg = "Failed to create host {}".format(body["name"])
        logger.warning(error_msg)
        return make_fail_resp(error=error_msg)


@bp_host_api.route('/host', methods=['PUT'])
def host_update():
    request_debug(r, logger)
    if r.content_type.startswith("application/json"):
        body = dict(r.get_json(force=True, silent=True))
    else:
        body = r.form
    if "id" not in body:
        error_msg = "host PUT without enough data"
        logger.warning(error_msg)
        return make_fail_resp(error=error_msg,
                              data=body)
    else:
        id, d = body["id"], {}
        for k in body:
            if k != "id":
                d[k] = body.get(k)
        result = host_handler.update(id, d)
        if result:
            logger.debug("host PUT successfully")
            return make_ok_resp()
        else:
            error_msg = "Failed to update host {}".format(result.get("name"))
            logger.warning(error_msg)
            return make_fail_resp(error=error_msg)


@bp_host_api.route('/host', methods=['PUT', 'DELETE'])
def host_delete():
    request_debug(r, logger)
    request_data = r.get_json(force=True, silent=True)
    if "id" in r.form:
        host_id = r.form["id"]
    elif "id" in request_data:
        host_id = request_data.get("id")
    else:
        error_msg = "host delete without enough data"
        logger.warning(error_msg)
        return make_fail_resp(error=error_msg, data=r.form)

    logger.debug("host delete with id={0}".format(host_id))
    if host_handler.delete(id=host_id):
        return make_ok_resp()
    else:
        error_msg = "Failed to delete host {}".format(host_id)
        logger.warning(error_msg)
        return make_fail_resp(error=error_msg)


@bp_host_api.route('/host_op', methods=['POST'])
def host_actions():
    logger.info("/host_op, method=" + r.method)
    request_debug(r, logger)
    if r.content_type.startswith("application/json"):
        body = dict(r.get_json(force=True, silent=True))
    else:
        body = r.form

    host_id, action = body['id'], body['action']
    if not host_id or not action:
        error_msg = "host POST without enough data"
        logger.warning(error_msg)
        return make_fail_resp(error=error_msg,
                              data=body)
    else:
        if action == "fillup":
            if host_handler.fillup(host_id):
                logger.debug("fillup successfully")
                return make_ok_resp()
            else:
                error_msg = "Failed to fillup the host."
                logger.warning(error_msg)
                return make_fail_resp(error=error_msg, data=body)
        elif action == "clean":
            if host_handler.clean(host_id):
                logger.debug("clean successfully")
                return make_ok_resp()
            else:
                error_msg = "Failed to clean the host."
                logger.warning(error_msg)
                return make_fail_resp(error=error_msg, data=body)
        elif action == "reset":
            if host_handler.reset(host_id):
                logger.debug("reset successfully")
                try:
                    host_model = HostModel.objects.get(id=host_id)
                    clusters = ClusterModel.objects(host=host_model)
                    for cluster_item in clusters:
                        cluster_item.delete()
                except Exception:
                    pass
                return make_ok_resp()
            else:
                error_msg = "Failed to reset the host."
                logger.warning(error_msg)
                return make_fail_resp(error=error_msg, data=body)

    error_msg = "unknown host action={}".format(action)
    logger.warning(error_msg)
    return make_fail_resp(error=error_msg, data=body)


def create_k8s_host(name, capacity, log_type, request):
    if request.get("k8s_ssl") == "on" and request.get("ssl_ca") is not None:
        k8s_ssl = "true"
        k8s_ssl_ca = request["ssl_ca"]
    else:
        k8s_ssl = "false"
        k8s_ssl_ca = None

    request['use_ssl'] = k8s_ssl
    request['use_ssl_ca'] = k8s_ssl_ca

    k8s_must_have_params = {
        'Name': name,
        'Capacity': capacity,
        'LoggingType': log_type,
        'K8SAddress': request['worker_api'],
        'K8SCredType': request['k8s_cred_type'],
        'K8SNfsServer': request['k8s_nfs_server'],
        'K8SUseSsl': request['use_ssl'],
        'K8SSslCert': request['use_ssl_ca']
    }

    if k8s_must_have_params['K8SCredType'] == K8S_CRED_TYPE['account']:
        k8s_must_have_params['K8SUsername'] = request['k8s_username']
        k8s_must_have_params['K8SPassword'] = request['k8s_password']
    elif k8s_must_have_params['K8SCredType'] == K8S_CRED_TYPE['cert']:
        k8s_must_have_params['K8SCert'] = request['k8s_cert']
        k8s_must_have_params['K8SKey'] = request['k8s_key']
    elif k8s_must_have_params['K8SCredType'] == K8S_CRED_TYPE['config']:
        k8s_must_have_params['K8SConfig'] = request['k8s_config']

    for key in k8s_must_have_params:
        if k8s_must_have_params[key] == '':
            error_msg = "host POST without {} data".format(key)
            logger.warning(error_msg)
            return []

    return k8s_must_have_params
