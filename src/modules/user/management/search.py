
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
from flask_restful import Resource, fields, marshal_with, reqparse
import logging
import sys
import os
from flask_login import login_required

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from common import log_handler, LOG_LEVEL, KeyCloakClient
from modules.user.user import User
from auth import oidc

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

user_search_fields = {
    "username": fields.String,
    "apikey": fields.String,
    "isActivated": fields.Boolean,
    "balance": fields.Integer,
    "user_exists": fields.Boolean
}

user_search_parser = reqparse.RequestParser()
user_search_parser.add_argument('username',
                                location='args',
                                help='Username for create')


class UserSearch(Resource):
    @oidc.accept_token(True)
    @marshal_with(user_search_fields)
    def get(self):
        """
        search user with username
        If user is existed return user info
        else return user_exists False
        :return:
        """
        args = user_search_parser.parse_args()
        username = args["username"]
        keycloak_client = KeyCloakClient()
        user = keycloak_client.get_user(username)
        logger.info("user {}".format(user))
        if not user:
            return {"user_exists": False}, 200

        data = {
            "username": username,
            "apikey": user.get("id"),
            # "isActivated": user.active,
            # "balance": user.balance,
            "user_exists": True
        }

        return data, 200
