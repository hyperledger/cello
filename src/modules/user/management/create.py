
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
from flask_restful import Resource, reqparse, fields, marshal_with
from flask_login import login_required
import logging
import sys
import os
from flask import current_app as app
import bcrypt

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from common import log_handler, LOG_LEVEL
from modules.models import ADMIN
from modules.user.user import User

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

user_create_fields = {
    "status": fields.String,
    "id": fields.String
}

user_create_parser = reqparse.RequestParser()
user_create_parser.add_argument('username', required=True,
                                location='form',
                                help='Username for create')
user_create_parser.add_argument('password', required=True,
                                location='form',
                                help='Password for create')
user_create_parser.add_argument('role', type=int, required=True,
                                location='form',
                                help='User role for create')
user_create_parser.add_argument('balance', type=int, default=0,
                                location='form',
                                help='User balance')
user_create_parser.add_argument('active', required=True,
                                location='form',
                                help='Whether active user when create')


class CreateUser(Resource):
    @login_required
    @marshal_with(user_create_fields)
    def post(self, **kwargs):
        args = user_create_parser.parse_args()
        username, password = args["username"], args["password"]
        role, active = args["role"], args["active"]
        balance = args["balance"]
        active = active == "true"
        salt = app.config.get("SALT", b"")
        password = bcrypt.hashpw(password.encode('utf8'), bytes(salt.encode()))
        status = "OK"
        user_id = ""

        try:
            user = User(username, password, is_admin=role == ADMIN,
                        role=role, active=active, balance=balance)
            user.save()
            user_id = user.id
        except Exception as exc:
            logger.error("exc %s", exc)
            status = "FAIL"

        return {"status": status, "id": user_id}, 200
