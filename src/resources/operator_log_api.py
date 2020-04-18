#
import logging
from modules.operator_log import OperatorLogHandler
from uuid import uuid4
from common import log_handler, LOG_LEVEL, \
    CODE_CREATED, make_ok_my_resp, \
    request_debug
from flask import Blueprint
from flask import request as r
from common.api_exception import BadRequest, UnsupportedMediaType, InternalServerError,NotFound

from datetime import datetime

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


bp_operator_log = Blueprint('bp_operator_log', __name__,
                        url_prefix='/{}'.format("v2"))


@bp_operator_log.route('/operator_logs', methods=['POST'])
def operator_log_create():
    request_debug(r, logger)
    if r.content_type.startswith("application/json"):
        body = dict(r.get_json(force=True, silent=True))['operator_log']
    else:
        error_msg = "request header content-type is not supported, use application/json"
        raise UnsupportedMediaType(msg=error_msg)

    opDate = body.get('opDate', None)
    opName = body.get('opName', '')
    opObject = body.get('opObject', '')
    opResult = body.get('opResult', {})
    operator = body.get('operator', '')
    opDetails = body.get('opDetails', '')

    op_log_handler = OperatorLogHandler()
    # id = uuid4().hex

    try:
        op_log = op_log_handler.create(
                                       opDate = opDate,
                                       opName = opName,
                                       opObject = opObject,
                                       opResult = opResult,
                                       operator = operator,
                                       opDetails = opDetails)

        return make_ok_my_resp(resource='operator_log', result=op_log)
    except Exception as e:
        msg = "operator_log create failed, error is  {e}, method is {m}".format(e=e, m=opName)
        logger.error(msg)
        raise InternalServerError(msg=msg)


@bp_operator_log.route('/operator_logs', methods=['GET'])
def operator_log_list():
    logger.info("/operator_log_list method=" + r.method)
    try:
        request_debug(r, logger)
        op_log_handler = OperatorLogHandler()

        col_filter = dict((key, r.args.get(key)) for key in r.args)
        # rest interface pass time in millsecond, but python datetime
        # use time in second
        start_stamp_in_sec = float(col_filter['start']) / 1000
        end_stamp_in_sec = float(col_filter['end']) / 1000


        if 'start' in col_filter.keys():
            start_time = datetime.utcfromtimestamp(start_stamp_in_sec)
            # start_time = datetime.utcfromtimestamp(1553247740.0)
            col_filter['opDate'] = {'$gte': start_time}
            col_filter.pop('start')
        if 'end' in col_filter.keys():
            end_time = datetime.utcfromtimestamp(end_stamp_in_sec)
            # end_time = datetime.utcfromtimestamp(1553247800.0)
            col_filter['opDate']['$lte'] = end_time
            col_filter.pop('end')

        items = list(op_log_handler.list(filter_data=col_filter))
    except:
        raise NotFound(msg='get operation logs failed')

    return make_ok_my_resp(resource='operator_logs', result=items)
