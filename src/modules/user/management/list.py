
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import os
import sys

from flask import g
from flask_restful import Resource, reqparse, fields, marshal_with

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from common import log_handler, LOG_LEVEL, KeyCloakClient
from auth import oidc

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


user_fields = {
    "id": fields.String,
    "name": fields.String,
    "isAdmin": fields.Boolean,
    "role": fields.String,
    "active": fields.Boolean,
    "email": fields.String,
    "tenant": fields.String,
    "createdTimeStamp": fields.Integer,
}

user_result_fields = {
    "result": fields.List(fields.Nested(user_fields)),
    "totalCount": fields.Integer,
    "pageSize": fields.Integer,
    "pageNo": fields.Integer
}

user_list_fields = {
    "users": fields.Nested(user_result_fields)
}

user_list_parser = reqparse.RequestParser()
user_list_parser.add_argument('pageNo', type=int, default=1,
                              help='Page number to query')
user_list_parser.add_argument('pageSize', type=int, default=10,
                              help='Page size to query')
user_list_parser.add_argument('sortColumns', default="",
                              help='Sorted columns to query')


class ListUser(Resource):
    @oidc.accept_token(True)
    @marshal_with(user_list_fields)
    def get(self, **kwargs):
        token_info = g.oidc_token_info
        # user_id = token_info.get("sub")
        # username = token_info.get("username")
        role = token_info.get("role", "")
        tenant = token_info.get("tenant", "")

        keycloak_client = KeyCloakClient()
        users = keycloak_client.list_users()
        user_list = []
        for user in users:
            user_role = user.get("attributes", {}).get("role", [])
            if len(user_role):
                user_role = user_role[0]
            else:
                user_role = "user"
            name = user.get("username", "")
            user_id = user.get("id")
            active = user.get("enabled", False)
            user_tenant = user.get("attributes", {}).get("tenant", [])
            if len(user_tenant):
                user_tenant = user_tenant[0]
            else:
                user_tenant = ""

            email = user.get("email", "")
            create_time_stamp = user.get("createdTimestamp", 0)
            if role == "administrator" or (role == "operator" and
                                           user_role != "administrator" and
                                           (user_tenant == tenant or
                                            user_tenant == "")):
                user_list.append({
                    "id": user_id,
                    "name": name,
                    "isAdmin": False,
                    "role": user_role,
                    "active": active,
                    "email": email,
                    "createdTimeStamp": create_time_stamp,
                    "tenant": user_tenant
                })

        user_count = len(user_list)

        result = {
            "users": {
                "result": user_list,
                "totalCount": user_count,
                "pageSize": 10,
                "pageNo": 1
            },
        }

        return result, 200
