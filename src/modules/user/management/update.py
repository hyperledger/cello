
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import os
import sys

from flask_restful import Resource, reqparse, fields, marshal_with

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from common import log_handler, LOG_LEVEL, KeyCloakClient
from auth import oidc

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

user_update_fields = {
    "status": fields.String,
    "error": fields.String
}

user_update_parser = reqparse.RequestParser()
user_update_parser.add_argument('username', required=True,
                                location=['form', 'json'],
                                help='Username for create')
user_update_parser.add_argument('role', type=str, required=True,
                                location=['form', 'json'],
                                help='User role for create')
user_update_parser.add_argument('active', required=True,
                                location=['form', 'json'],
                                help='Whether active user when create')


class UpdateUser(Resource):
    @oidc.accept_token(True)
    @marshal_with(user_update_fields)
    def put(self, user_id):
        args = user_update_parser.parse_args()
        username = args["username"]
        role, active = args["role"], args["active"]
        active = active == "true"
        status = "OK"
        error_msg = ""
        status_code = 200

        keycloak_client = KeyCloakClient()
        try:
            user_id = keycloak_client.get_user_id(username)
            body = {
                "attributes": {
                    "role": role,
                },
                "enabled": active
            }
            keycloak_client.update_user(user_id, body)
        except Exception as exc:
            error_msg = exc.message
            logger.warning(error_msg)
            status = "FAIL"
            status_code = 400

        return {"status": status, "error": error_msg}, status_code
