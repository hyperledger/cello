
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
from flask_restful import Resource, reqparse, fields, marshal_with
import logging
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from common import log_handler, LOG_LEVEL, KeyCloakClient
from auth import oidc

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

user_create_fields = {
    "status": fields.String,
    "id": fields.String
}

user_create_parser = reqparse.RequestParser()
user_create_parser.add_argument('username', required=True,
                                location=['form', 'json'],
                                help='Username for create')
user_create_parser.add_argument('password', required=True,
                                location=['form', 'json'],
                                help='Password for create')
user_create_parser.add_argument('role', type=str, required=True,
                                location=['form', 'json'],
                                help='User role for create')
user_create_parser.add_argument('active', required=True,
                                location=['form', 'json'],
                                help='Whether active user when create')


class CreateUser(Resource):
    @oidc.accept_token(True)
    @marshal_with(user_create_fields)
    def post(self, **kwargs):
        args = user_create_parser.parse_args()
        username, password = args["username"], args["password"]
        role, active = args["role"], args["active"]
        active = active == "true"
        status = "OK"
        status_code = 200
        user_id = ""
        keycloak_client = KeyCloakClient()

        try:
            create_user_body = {
                "username": username,
                "requiredActions": [],
                "enabled": active
            }

            keycloak_client.create_user(create_user_body)

            user_id = keycloak_client.get_user_id(username=username)
            keycloak_client.reset_user_password(user_id, password)
            keycloak_client.update_user(user_id, body={
                "attributes": {
                    "role": role,
                },
            })
        except Exception as exc:
            logger.error("exc %s", exc)
            status = "FAIL"
            status_code = 400

        return {"status": status, "id": user_id}, status_code
