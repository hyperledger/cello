
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
from flask_restful import Resource, reqparse, fields, marshal_with
import logging
import sys
import os
from flask import current_app as app
import bcrypt

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from common import log_handler, LOG_LEVEL
from modules.user.user import User

ENABLE_EMAIL_ACTIVE = os.environ.get("ENABLE_EMAIL_ACTIVE", "False")
ENABLE_EMAIL_ACTIVE = ENABLE_EMAIL_ACTIVE == "True"

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

register_fields = {
    "username": fields.String,
    "apikey": fields.String,
    "isActivated": fields.Boolean,
    "balance": fields.Integer,
    "success": fields.Boolean,
    "error": fields.String
}

register_parser = reqparse.RequestParser()
register_parser.add_argument('username', required=True,
                             location='form',
                             help='Username for create')
register_parser.add_argument('password', required=True,
                             location='form',
                             help='Password for create')


class Register(Resource):
    # @login_required
    @marshal_with(register_fields)
    def post(self, **kwargs):
        args = register_parser.parse_args()
        username, password = args["username"], args["password"]
        salt = app.config.get("SALT", b"")
        password = bcrypt.hashpw(password.encode('utf8'), bytes(salt.encode()))

        default_active = not ENABLE_EMAIL_ACTIVE
        try:
            user = User(username, password, active=default_active)
            user_id = user.save()
            user = user.get_by_id(user_id)
            data = {
                "username": user.username,
                "apikey": str(user.id),
                "isActivated": user.active,
                "balance": user.balance,
                "success": True
            }
            return data, 200
        except Exception as exc:
            logger.error("exc %s", exc)
            data = {
                "success": False,
                "error": "register failed"
            }
            return data, 400
