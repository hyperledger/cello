
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
from common import log_handler, LOG_LEVEL, KeyCloakClient

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
user_password_parser.add_argument('new_password', required=True,
                                  location='form',
                                  help='New Password')


class ResetPassword(Resource):
    @marshal_with(user_password_fields)
    def post(self, user_id):
        args = user_password_parser.parse_args()
        new_password = args["new_password"]

        keycloak_client = KeyCloakClient()
        keycloak_client.reset_user_password(user_id, new_password)

        data = {
            "success": True
        }

        return data, 200
