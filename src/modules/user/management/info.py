
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
from flask_restful import Resource, fields, marshal_with
from flask_login import login_required
import logging
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from common import log_handler, LOG_LEVEL
from modules.user.user import User

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

user_info_fields = {
    "username": fields.String,
    "apikey": fields.String,
    "isActivated": fields.Boolean,
    "balance": fields.Integer,
    "success": fields.Boolean,
    "error": fields.String
}


class UserInfo(Resource):
    @marshal_with(user_info_fields)
    def get(self, user_id):
        user_obj = User()
        user = user_obj.get_by_id(user_id)
        if not user:
            return {"error": "No such User", "success": False}, 400

        data = {
            "username": user.username,
            "apikey": str(user.id),
            "isActivated": user.active,
            "balance": user.balance,
            "success": True
        }

        return data, 200
