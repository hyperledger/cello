
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
from flask_restful import Resource, fields, marshal_with
from flask_login import login_required
import logging
import sys
import os

import datetime
from modules.operator_log import OperatorLogHandler

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from common import log_handler, LOG_LEVEL
from modules.models import User as UserModel

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

user_delete_fields = {
    "status": fields.String
}


class DeleteUser(Resource):
    @login_required
    @marshal_with(user_delete_fields)
    def delete(self, user_id):

        # add operating log
        cur_time = datetime.datetime.utcnow()
        opName = 'DeleteUser'
        opObject = "User"
        operator = "admin"
        opDetails = {}
        opDetails['user_id'] = user_id

        op_log_handler = OperatorLogHandler()

        try:
            user = UserModel.objects.get(id=user_id)
        except Exception:
            error_msg = "Couldn't find user {id}".format(id=user_id)
            op_log_handler.record_operating_log(
                opDate=cur_time,
                opName=opName,
                opObject=opObject,
                resCode=404,
                operator=operator,
                errorMsg=error_msg,
                opDetails=opDetails)

        else:
            user.delete()
            op_log_handler.record_operating_log(
                opDate=cur_time,
                opName=opName,
                opObject=opObject,
                resCode=200,
                operator=operator,
                opDetails=opDetails)

        return {"status": "OK"}, 200
