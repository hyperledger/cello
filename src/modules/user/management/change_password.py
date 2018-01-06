
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
from flask_restful import Resource, fields, marshal_with, reqparse
import logging
import sys
import os
from flask import current_app as app
import bcrypt

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from common import log_handler, LOG_LEVEL
from modules.user.user import User

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

user_password_fields = {
    "username": fields.String,
    "apikey": fields.String,
    "isActivated": fields.Boolean,
    "balance": fields.Integer,
    "success": fields.Boolean,
    "error": fields.String
}

user_password_parser = reqparse.RequestParser()
user_password_parser.add_argument('origin_password', required=True,
                                  location='form',
                                  help='Origin Password')
user_password_parser.add_argument('new_password', required=True,
                                  location='form',
                                  help='New Password')


class ChangePassword(Resource):
    """ Manage user change password api
    """
    @marshal_with(user_password_fields)
    def post(self, user_id):
        args = user_password_parser.parse_args()
        origin_password, new_password = \
            args["origin_password"], args["new_password"]

        user_obj = User()
        user = user_obj.get_by_id(user_id)
        if not user:
            return {"error": "No such User", "success": False}, 400
        salt = app.config.get("SALT", b"")
        password = bcrypt.hashpw(origin_password.encode('utf8'),
                                 bytes(salt.encode()))
        if not password.decode() == user.dbUser.password:
            return {"error": "Invalid origin password", "success": False}, 400
        new_password = bcrypt.hashpw(new_password.encode('utf8'),
                                     bytes(salt.encode()))

        user.update_password(new_password.decode())

        data = {
            "success": True
        }

        return data, 200
