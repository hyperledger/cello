# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import os
import sys
import datetime
from uuid import uuid4

from flask import Blueprint
from flask import request as r
from modules import host_handler
from common import utils
from modules.blockchain_network import BlockchainNetworkHandler
from modules.operator_log import OperatorLogHandler

from common.api_exception import BadRequest, UnsupportedMediaType, InternalServerError,NotFound

# sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import log_handler, LOG_LEVEL, \
    CODE_CREATED, make_ok_my_resp, \
    request_debug

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)
from modules.models import modelv2

# CELLO_MASTER_FABRIC_DIR is mounted by nfs container as '/'
CELLO_MASTER_FABRIC_DIR = '/opt/fabric/'

bp_blockchain_network_api = Blueprint('bp_blockchain_network_api', __name__,
                        url_prefix='/{}'.format("v2"))


@bp_blockchain_network_api.route('/blockchain_networks', methods=['POST'])
def blockchain_network_create():
    request_debug(r, logger)

    # add operating log
    # cur_time = datetime.datetime.utcnow()
    cur_time = datetime.datetime.utcnow()
    opName = sys._getframe().f_code.co_name
    opObject = "Network"
    operator = "admin"
    op_log_handler = OperatorLogHandler()

    if r.content_type.startswith("application/json"):
        body = dict(r.get_json(force=True, silent=True))['blockchain_network']
        opDetails = body
    else:
        error_msg = "request header content-type is not supported, use application/json"

        op_log_handler.record_operating_log(
            opDate=cur_time,
            opName=opName,
            opObject=opObject,
            resCode=400,
            operator=operator,
            errorMsg=error_msg)

        raise UnsupportedMediaType(msg=error_msg)

    name = body.get('name', None)
    orderer_orgs = body.get('orderer_orgs', None)
    peer_orgs = body.get('peer_orgs', None)
    host_id = body.get('host_id', None)
    db_type = body.get('db_type', 'couchdb')
    if name is None or orderer_orgs is None or peer_orgs is None or host_id is None:
        error_msg = "name, orderer(peer)_orgs and host_id must be provided in request body"

        op_log_handler.record_operating_log(
            opDate=cur_time,
            opName=opName,
            opObject=opObject,
            resCode=400,
            operator=operator,
            errorMsg=error_msg,
            opDetails=opDetails)

        raise BadRequest(msg=error_msg)

    description = body.get('description', "")
    fabric_version = body.get('fabric_version', None)
    if fabric_version is None or (fabric_version != 'v1.1' and fabric_version != 'v1.4'):
        error_msg = "Now only fabric v1.1 and v1.4 is supported"

        op_log_handler.record_operating_log(
            opDate=cur_time,
            opName=opName,
            opObject=opObject,
            resCode=400,
            operator=operator,
            errorMsg=error_msg,
            opDetails=opDetails)

        raise BadRequest(msg=error_msg)
    consensus_type = body.get('consensus_type', None)
    if consensus_type is None:
        consensus_type = 'kafka'
    elif consensus_type not in ['etcdraft', 'kafka', 'solo']:
        error_msg = 'consensus type {} is not supported'.format(consensus_type)

        op_log_handler.record_operating_log(
            opDate=cur_time,
            opName=opName,
            opObject=opObject,
            resCode=400,
            operator=operator,
            errorMsg=error_msg,
            opDetails=opDetails)

        raise BadRequest(msg=error_msg)

    id = uuid4().hex
    host = host_handler.get_active_host_by_id(host_id)
    if not host:
        error_msg = "Cannot find available host to create new network"
        logger.error(error_msg)

        op_log_handler.record_operating_log(
            opDate=cur_time,
            opName=opName,
            opObject=opObject,
            resCode=500,
            operator=operator,
            errorMsg=error_msg,
            opDetails=opDetails)

        raise InternalServerError(msg=error_msg)


    network_handler = BlockchainNetworkHandler()
    try:
        network = network_handler.create(id = id,
                               name = name,
                               description = description,
                               fabric_version = fabric_version,
                               orderer_orgs = orderer_orgs,
                               peer_orgs = peer_orgs,
                               host= host,
                               consensus_type = consensus_type,
                               db_type = db_type,
                               create_ts = cur_time
                               )

        op_log_handler.record_operating_log(
            opDate=cur_time,
            opName=opName,
            opObject=opObject,
            resCode=200,
            operator=operator,
            opDetails=opDetails)
        return make_ok_my_resp(resource='blockchain_network', result=network)
    except Exception as e:
        error_msg = "blockchain_network create failed {}".format(e)
        logger.error(error_msg)

        op_log_handler.record_operating_log(
            opDate=cur_time,
            opName=opName,
            opObject=opObject,
            resCode=500,
            operator=operator,
            errorMsg=error_msg,
            opDetails=opDetails)

        raise InternalServerError(msg=error_msg)

@bp_blockchain_network_api.route('/blockchain_networks/<blockchain_network_id>/orgAdd', methods=['POST'])
def blockchain_network_add_org(blockchain_network_id):
    request_debug(r, logger)
    if r.content_type.startswith("application/json"):
        body = dict(r.get_json(force=True, silent=True))['blockchain_network']
    else:
        error_msg = "request header content-type is not supported, use application/json"
        raise UnsupportedMediaType(msg=error_msg)

    peer_orgs = body.get('peer_orgs', None)
    if peer_orgs is None:
        raise BadRequest(msg="peer_orgs must be provided in request body")
    orderer_orgs = body.get('orderer_orgs', None)

    network_handler = BlockchainNetworkHandler()
    try:
        network = network_handler.addorgtonetwork(id = blockchain_network_id,
                               peer_orgs = peer_orgs, orderer_orgs = orderer_orgs,
                               )
        return make_ok_my_resp(resource='blockchain_network', result=network)
    except Exception as e:
        msg = "blockchain_network add org failed {}".format(e)
        logger.error(msg)
        raise InternalServerError(msg=msg)

@bp_blockchain_network_api.route('/blockchain_networks/<blockchain_network_id>/createyamlforneworgs', methods=['POST'])
def blockchain_network_create_yarml_for_neworgs(blockchain_network_id):
    request_debug(r, logger)
    if r.content_type.startswith("application/json"):
        body = dict(r.get_json(force=True, silent=True))['blockchain_network']
    else:
        error_msg = "request header content-type is not supported, use application/json"
        raise UnsupportedMediaType(msg=error_msg)

    peer_orgs = body.get('peer_orgs', None)
    if peer_orgs is None:
        raise BadRequest(msg="peer_orgs must be provided in request body")
    orderer_orgs = body.get('orderer_orgs', None)

    network_handler = BlockchainNetworkHandler()
    try:
        network = network_handler.createyamlforneworgs(id = blockchain_network_id,
                               peer_orgs = peer_orgs,orderer_orgs = orderer_orgs,
                               )
        return make_ok_my_resp(resource='blockchain_network', result=network)
    except Exception as e:
        msg = "blockchain_network add org failed {}".format(e)
        logger.error(msg)
        raise InternalServerError(msg=msg)

@bp_blockchain_network_api.route('/blockchain_networks', methods=['GET'])
def blockchain_network_list():
    logger.info("/blockchain_network method=" + r.method)
    request_debug(r, logger)
    col_filter = dict((key, r.args.get(key)) for key in r.args)
    network_handler = BlockchainNetworkHandler()
    items = list(network_handler.list(filter_data=col_filter))

    return make_ok_my_resp(resource='blockchain_networks',result=items)


@bp_blockchain_network_api.route('/blockchain_networks/<blockchain_network_id>', methods=['GET'])
def blockchain_network_query(blockchain_network_id):
    request_debug(r, logger)
    network_handler = BlockchainNetworkHandler()
    result = network_handler.schema(network_handler.get_by_id(blockchain_network_id))
    logger.debug(result)
    if result:
        return make_ok_my_resp(resource='blockchain_network', result=result)
    else:
        error_msg = "blockchain_network not found with id=" + blockchain_network_id
        logger.warning(error_msg)
        raise NotFound(msg=error_msg)

@bp_blockchain_network_api.route('/blockchain_networks/<blockchain_network_id>/serviceendpoints', methods=['GET'])
def service_endporint_query(blockchain_network_id):
    request_debug(r, logger)
    network_handler = BlockchainNetworkHandler()

    col_filter = blockchain_network_id
    items = list(network_handler.get_endpoints_list(filter_data=col_filter))

    return make_ok_my_resp(resource='service_endpoints',result=items)

@bp_blockchain_network_api.route('/blockchain_networks/<blockchain_network_id>', methods=['DELETE'])
def blockchain_network_delete(blockchain_network_id):
    network_handler = BlockchainNetworkHandler()

    # add operating log
    cur_time = datetime.datetime.utcnow()
    opName = sys._getframe().f_code.co_name
    opObject = "Network"
    operator = "admin"
    op_log_handler = OperatorLogHandler()
    opDetails = {}
    opDetails['blockchain_network_id'] = blockchain_network_id

    try:
        network = modelv2.BlockchainNetwork.objects.get(id = blockchain_network_id)
        if network.status == 'error':
            host = network.host
            host.update(pull__clusters = blockchain_network_id)
            # if org has referenced network, remove
            for peer_org in network.peer_orgs:
                org_obj = modelv2.Organization.objects.get(id=peer_org)
                org_obj.update(unset__network=network.id)
            for orderer_org in network.orderer_orgs:
                org_obj = modelv2.Organization.objects.get(id=orderer_org)
                org_obj.update(unset__network=network.id)
            network.delete()
            filepath = '{}{}'.format(CELLO_MASTER_FABRIC_DIR, network.id)
            os.system('rm -rf {}'.format(filepath))

            op_log_handler.record_operating_log(
                opDate=cur_time,
                opName=opName,
                opObject=opObject,
                resCode=200,
                operator=operator,
                opDetails=opDetails
                 )

            return make_ok_my_resp(resource='delete success!',result={})
    except Exception as e:
        error_msg = "blockchain_network {id} delete failed, for {err}".\
                                 format(id = blockchain_network_id, err = e)
        logger.error(error_msg)

        op_log_handler.record_operating_log(
            opDate=cur_time,
            opName=opName,
            opObject=opObject,
            resCode=404,
            operator=operator,
            errorMsg=error_msg,
            opDetails=opDetails)

        raise NotFound(msg=error_msg)
    try:
        network_handler.delete(network)

        op_log_handler.record_operating_log(
            opDate=cur_time,
            opName=opName,
            opObject=opObject,
            resCode=200,
            operator=operator,
            opDetails=opDetails)

        return make_ok_my_resp(resource='delete success!', result={})
    except Exception as e:
        error_msg = "blockchain_network {id} delete failed, for {err}". \
                                 format(id=blockchain_network_id, err=e)
        logger.error(error_msg)

        op_log_handler.record_operating_log(
            opDate=cur_time,
            opName=opName,
            opObject=opObject,
            resCode=500,
            operator=operator,
            errorMsg=error_msg,
            opDetails=opDetails)

        raise InternalServerError(msg=error_msg)

@bp_blockchain_network_api.route('/blockchain_networks/<blockchain_network_id>/networkhealthy', methods=['GET'])
def net_healthy_query(blockchain_network_id):
    request_debug(r, logger)
    network_handler = BlockchainNetworkHandler()

    col_filter = blockchain_network_id
    infos = network_handler.get_endpoints_list(filter_data=col_filter)
    for info in infos:
        if info["service_type"] == 'peer' and info["peer_port_proto"] == 'cc_listen':
            infos.remove(info)
            continue

    return make_ok_my_resp(resource='healthy',result=infos)

@bp_blockchain_network_api.route('/blockchain_networks/<organization_id>/organizationhealthy', methods=['GET'])
def org_healthy_query(organization_id):
    request_debug(r, logger)
    network_handler = BlockchainNetworkHandler()

    serviceEndpoints = modelv2.ServiceEndpoint.objects(org_name=organization_id)
    infos = network_handler.endports_schema(serviceEndpoints, many=True)

    for info in infos:
        if info["service_type"] == 'peer' and info["peer_port_proto"] == 'cc_listen':
            infos.remove(info)
            continue

    return make_ok_my_resp(resource='healthy', result=infos)








