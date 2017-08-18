
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
from flask_restful import Resource, reqparse, fields, marshal_with
from flask_login import login_required
import logging
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from common import log_handler, LOG_LEVEL
from resources.models import User as UserModel

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

user_update_fields = {
    "status": fields.String,
    "error": fields.String
}

user_update_parser = reqparse.RequestParser()
user_update_parser.add_argument('username', required=True,
                                location='form',
                                help='Username for create')
user_update_parser.add_argument('role', type=int, required=True,
                                location='form',
                                help='User role for create')
user_update_parser.add_argument('balance', type=int, default=0,
                                location='form',
                                help='User balance')
user_update_parser.add_argument('active', required=True,
                                location='form',
                                help='Whether active user when create')


class UpdateUser(Resource):
    @login_required
    @marshal_with(user_update_fields)
    def put(self, user_id):
        args = user_update_parser.parse_args()
        username = args["username"]
        role, active = args["role"], args["active"]
        balance = args["balance"]
        active = active == "true"
        status = "OK"
        error_msg = ""

        try:
            UserModel.objects(id=user_id).update(set__username=username,
                                                 set__active=active,
                                                 set__balance=balance,
                                                 set__role=role, upsert=True)
        except Exception as exc:
            error_msg = exc.message
            logger.warning(error_msg)
            status = "FAIL"

        return {"status": status, "error": error_msg}, 200
