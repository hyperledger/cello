
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import os
import sys

import bcrypt
from flask import url_for
from flask_login import login_user
from flask_restful import Resource, reqparse, fields, marshal_with

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from common import log_handler, LOG_LEVEL
from modules.user.user import User
from modules.models import LoginHistory

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

login_fields = {
    "success": fields.Boolean,
    "id": fields.String,
    "role": fields.Integer,
    "next": fields.String,
    "error": fields.String
}

login_parser = reqparse.RequestParser()
login_parser.add_argument('username', required=True,
                          location=['form', 'json'],
                          help='Username for create')
login_parser.add_argument('password', required=True,
                          location=['form', 'json'],
                          help='Password for create')


class Login(Resource):
    @marshal_with(login_fields)
    def post(self, **kwargs):
        args = login_parser.parse_args()
        username, password = args["username"], args["password"]

        user_obj = User()
        try:
            user = user_obj.get_by_username(username)
            # compare input password with password in db
            if bcrypt.checkpw(password.encode('utf8'),
                              bytes(user.password.encode())):
                login_user(user)

                # if login success save login history
                login_history = LoginHistory(user=user.dbUser)
                login_history.save()
                user_id = str(user.id)
                data = {
                    "success": True,
                    "id": user_id,
                    "role": user.user_role,
                    "next": url_for('bp_index.show')
                }

                return data, 200
            else:
                data = {
                    "success": False,
                    "error": "Wrong username or password"
                }
                return data, 401
        except Exception as exc:
            logger.info("error {}".format(exc))
            data = {
                "success": False,
                "error": "login failed"
            }
            return data, 401
