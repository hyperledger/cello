# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import os
import sys
import datetime
from uuid import uuid4

from flask import jsonify, Blueprint, render_template
from flask import request as r

from modules.organization import organizationHandler as org_handler
from common.api_exception import UnsupportedMediaType, InternalServerError
from common.api_exception import BadRequest, NotFound, Forbidden

from modules.operator_log import OperatorLogHandler
from modules import host_handler

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import fabric_network_define,log_handler, LOG_LEVEL, \
    make_ok_my_resp, make_fail_resp, \
    CODE_CREATED, make_ok_my_resp, \
    request_debug

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


bp_organization_api = Blueprint('bp_organization_api', __name__,
                        url_prefix='/{}'.format("v2"))


@bp_organization_api.route('/organizations', methods=['POST'])
def organization_create():
    request_debug(r, logger)

    # add operating log
    cur_time = datetime.datetime.utcnow()
    # get current func name
    opName = sys._getframe().f_code.co_name
    opObject = "Organization"
    operator = "admin"
    opResult = {}
    op_log_handler = OperatorLogHandler()

    if r.content_type.startswith("application/json"):
        body = dict(r.get_json(force=True, silent=True))['organization']
        opDetails = body
    else:
        error_msg = "request header content-type is not supported, use application/json"
        opResult['resDes'] = "ERROR"
        opResult['resCode'] = 400
        opResult['errorMsg'] = error_msg
        op_log_handler.create(opDate=cur_time,
                              opName=opName,
                              opObject=opObject,
                              opResult=opResult,
                              operator=operator)

        raise UnsupportedMediaType(error_msg)

    name = body.get('name', None)
    type = body.get('type', None)
    domain = body.get('domain', None)

    organizations = list(org_handler().list())
    org_names = []
    for org in organizations:
        org_names.append(org['name'])
    if name in org_names:
        error_msg = "the same org name has exist,please use another name "
        opResult['resDes'] = "ERROR"
        opResult['resCode'] = 400
        opResult['errorMsg'] = error_msg
        op_log_handler.create(opDate=cur_time,
                              opName=opName,
                              opObject=opObject,
                              opResult=opResult,
                              operator=operator,
                              opDetails=opDetails)

        raise BadRequest(msg=error_msg)

    if name is None or name == '':
        error_msg = "name is required and not allowed to be ''"

        opResult['resDes'] = "ERROR"
        opResult['resCode'] = 400
        opResult['errorMsg'] = error_msg
        op_log_handler.create(opDate=cur_time,
                              opName=opName,
                              opObject=opObject,
                              opResult=opResult,
                              operator=operator,
                              opDetails=opDetails)

        raise BadRequest(msg=error_msg)
    # if there is '_' in name or ID of genesis.block, orderer couldn't
    # start up, saying "failed: error converting config to map: Illegal characters in key: [Group]"
    if '_' in name:
        # aaa = BadRequest("'_' is not allowed in name or ID")
        # # raise BadRequest("'_' is not allowed in name or ID")
        # raise aaa
        error_msg = '_ is not allowed in name or ID'

        opResult['resDes'] = "ERROR"
        opResult['resCode'] = 400
        opResult['errorMsg'] = error_msg
        op_log_handler.create(opDate=cur_time,
                              opName=opName,
                              opObject=opObject,
                              opResult=opResult,
                              operator=operator,
                              opDetails=opDetails)

        raise BadRequest(msg=error_msg)

    if domain is None or domain =='':
        error_msg = "domain is required and not allowed to be ''"

        opResult['resDes'] = "ERROR"
        opResult['resCode'] = 400
        opResult['errorMsg'] = error_msg
        op_log_handler.create(opDate=cur_time,
                              opName=opName,
                              opObject=opObject,
                              opResult=opResult,
                              operator=operator,
                              opDetails=opDetails)

        raise BadRequest(msg=error_msg)
    if type is None:
        error_msg = "type is required"

        opResult['resDes'] = "ERROR"
        opResult['resCode'] = 400
        opResult['errorMsg'] = error_msg
        op_log_handler.create(opDate=cur_time,
                              opName=opName,
                              opObject=opObject,
                              opResult=opResult,
                              operator=operator,
                              opDetails=opDetails)

        raise BadRequest(msg=error_msg)
    if body['type'] not in ['peer', 'orderer']:
        error_msg = "only peer or orderer type is supported"

        opResult['resDes'] = "ERROR"
        opResult['resCode'] = 400
        opResult['errorMsg'] = error_msg
        op_log_handler.create(opDate=cur_time,
                              opName=opName,
                              opObject=opObject,
                              opResult=opResult,
                              operator=operator,
                              opDetails=opDetails)

        raise BadRequest(msg=error_msg)


    ordererHostnames = body.get('ordererHostnames', None)
    peerNum = body.get('peerNum', None)
    ca = body.get('ca', {})
    host_id = body.get('host_id', None)
    host = host_handler.get_active_host_by_id(host_id)
    id = uuid4().hex
    description = body.get('description', "")

    if body['type'] == 'peer':
        if ordererHostnames is not None:

            error_msg = "peer type organizations don't need ordererHostnames"

            opResult['resDes'] = "ERROR"
            opResult['resCode'] = 400
            opResult['errorMsg'] = error_msg
            op_log_handler.create(opDate=cur_time,
                                  opName=opName,
                                  opObject=opObject,
                                  opResult=opResult,
                                  operator=operator,
                                  opDetails=opDetails)
            raise BadRequest(msg=error_msg)
        if peerNum is None:
            peerNum = 2
        try:
            result = org_handler().create(id=id,
                                          name=name,
                                          description=description,
                                          type=type,
                                          domain=domain,
                                          peerNum=int(peerNum),
                                          ca=ca,
                                          host=host,
                                          ordererHostnames=[])


            opResult['resDes'] = "OK"
            opResult['resCode'] = 200
            opResult['errorMsg'] = ''
            op_log_handler.create(opDate=cur_time,
                                  opName=opName,
                                  opObject=opObject,
                                  opResult=opResult,
                                  operator=operator,
                                  opDetails=opDetails)

            return make_ok_my_resp('organization', result)
        except Exception as e:
            error_msg = "internal server error"
            opResult['resDes'] = "ERROR"
            opResult['resCode'] = 500
            opResult['errorMsg'] = error_msg
            op_log_handler.create(opDate=cur_time,
                                  opName=opName,
                                  opObject=opObject,
                                  opResult=opResult,
                                  operator=operator,
                                  opDetails=opDetails)

            raise InternalServerError()
    else:
        if peerNum is not None:
            error_msg = "orderer type organizations don't need peers"

            opResult['resDes'] = "ERROR"
            opResult['resCode'] = 400
            opResult['errorMsg'] = error_msg
            op_log_handler.create(opDate=cur_time,
                                  opName=opName,
                                  opObject=opObject,
                                  opResult=opResult,
                                  operator=operator,
                                  opDetails=opDetails)

            raise BadRequest(msg=error_msg)
            # userNum = body.get('userNum', None)
        try:
            result = org_handler().create(id=id,
                                          name=name,
                                          description=description,
                                          type=type,
                                          domain=domain,
                                          ca=ca,
                                          peerNum = 0,
                                          host=host,
                                          ordererHostnames=ordererHostnames)

            opResult['resDes'] = "OK"
            opResult['resCode'] = 200
            opResult['errorMsg'] = ''
            op_log_handler.create(opDate=cur_time,
                                  opName=opName,
                                  opObject=opObject,
                                  opResult=opResult,
                                  operator=operator,
                                  opDetails=opDetails)

            return make_ok_my_resp('organization', result)
        except Exception as e:
            error_msg = "internal server error"
            op_log_handler.record_operating_log(
                opDate=cur_time,
                opName=opName,
                opObject=opObject,
                resCode=500,
                operator=operator,
                errorMsg=error_msg,
                opDetails=opDetails)

            raise InternalServerError()

@bp_organization_api.route('/organizations', methods=['GET'])
def organization_list():
    logger.info("/organization_list method=" + r.method)
    try:
        request_debug(r, logger)

        col_filter = dict((key, r.args.get(key)) for key in r.args)
        items = list(org_handler().list(filter_data=col_filter))
    except:
        raise NotFound(msg='get organizations failed')

    return make_ok_my_resp(resource='organizations',result=items)

@bp_organization_api.route('/organizations/<organization_id>', methods=['GET'])
def organization_query(organization_id):
    try:
        request_debug(r, logger)
        result = org_handler().schema(org_handler().get_by_id(organization_id))
        logger.debug(result)
        if result:
            return make_ok_my_resp(resource='organization',result=result)
        else:
            error_msg = "organization not found with id=" + organization_id
            logger.warning(error_msg)
            raise NotFound(msg=error_msg)
    except:
        raise NotFound(msg='get organization failed')

@bp_organization_api.route('/organizations/<organization_id>', methods=['PUT'])
def organization_update(organization_id):
    request_debug(r, logger)
    if r.content_type.startswith("application/json"):
        body = dict(r.get_json(force=True, silent=True))
    else:
        body = r.form

    id = organization_id

    peerNum = body["peerNum"]

    result = org_handler().update(id, peerNum)
    if result:
        logger.debug("organization PUT successfully")
        return make_ok_my_resp(resource='organization',result=result)
    else:
        error_msg = "Failed to update organization {}".format(result.get("name"))
        logger.warning(error_msg)
        return make_fail_resp(error=error_msg)

@bp_organization_api.route('/organizations/<organization_id>', methods=['DELETE'])
def organization_delete(organization_id):
    request_debug(r, logger)
    request_data = org_handler().get_by_id(organization_id)

    # add operating log
    cur_time = datetime.datetime.utcnow()
    opName = sys._getframe().f_code.co_name
    opObject = "Organization"
    operator = "admin"
    opResult = {}
    opDetails = {}
    opDetails['organization_id'] = organization_id


    op_log_handler = OperatorLogHandler()

    if request_data is not None and "id" in request_data:
        if request_data.network is not None:
            error_msg = "network has created, organization {} is forbidden to delete.".format(organization_id)
            logger.warning(error_msg)

            opResult['resDes'] = "ERROR"
            opResult['resCode'] = 500
            opResult['errorMsg'] = error_msg
            op_log_handler.create(opDate=cur_time,
                                  opName=opName,
                                  opObject=opObject,
                                  opResult=opResult,
                                  operator=operator)

            raise Forbidden(msg=error_msg)
        else:
            pass
    else:
        error_msg = "organization delete without enough data"
        logger.warning(error_msg)

        opResult['resDes'] = "ERROR"
        opResult['resCode'] = 404
        opResult['errorMsg'] = error_msg
        op_log_handler.create(opDate=cur_time,
                              opName=opName,
                              opObject=opObject,
                              opResult=opResult,
                              operator=operator,
                              opDetails=opDetails)

        raise NotFound(msg=error_msg)

    logger.debug("host delete with id={0}".format(organization_id))
    if org_handler().delete(id=organization_id):

        opResult['resDes'] = "OK"
        opResult['resCode'] = 200
        opResult['errorMsg'] = ''
        op_log_handler.create(opDate=cur_time,
                              opName=opName,
                              opObject=opObject,
                              opResult=opResult,
                              operator=operator,
                              opDetails=opDetails)

        return make_ok_my_resp(resource='delete success!',result={})
    else:
        error_msg = "Failed to delete organization {}".format(organization_id)
        logger.warning(error_msg)

        opResult['resDes'] = "ERROR"
        opResult['resCode'] = 500
        opResult['errorMsg'] = error_msg
        op_log_handler.create(opDate=cur_time,
                              opName=opName,
                              opObject=opObject,
                              opResult=opResult,
                              operator=operator,
                              opDetails=opDetails)

        raise InternalServerError(msg=error_msg)



