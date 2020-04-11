
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
import datetime

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from common import log_handler, LOG_LEVEL
from modules.user.user import User
from modules.operator_log import OperatorLogHandler

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
user_password_parser.add_argument('password', required=True,
                                  location=['form', 'json'],
                                  help='New Password')
user_password_parser.add_argument('curPassword', required=True,
                                  location=['form', 'json'],
                                  help='Cur user Password')
user_password_parser.add_argument('curUser', required=True,
                                  location=['form', 'json'],
                                  help='Cur user')


class ResetPassword(Resource):
    @marshal_with(user_password_fields)
    def post(self, username):
        args = user_password_parser.parse_args()
        new_password = args["password"]
        curUser = args["curUser"]
        curPassword = args["curPassword"]

        op_log_handler = OperatorLogHandler()
        opName = 'ResetUserPassword'
        opObject = "User"
        operator = "admin"
        opDetails = {}
        opDetails['username'] = username
        cur_time = datetime.datetime.utcnow()

        user_obj = User()
        userCurrent = user_obj.get_by_username(curUser)
        # compare input password with password in db
        if not bcrypt.checkpw(curPassword.encode('utf8'),
                              bytes(userCurrent.dbUser.password.encode())):
            error_msg = "Wrong password"
            op_log_handler.record_operating_log(
                opDate=cur_time,
                opName=opName,
                opObject=opObject,
                resCode=400,
                operator=operator,
                errorMsg=error_msg,
                opDetails=opDetails)
            return {"error": "Wrong password", "success": False}, 400

        user = user_obj.get_by_username(username)
        if not user:
            error_msg = "No such User"
            op_log_handler.record_operating_log(
                opDate=cur_time,
                opName=opName,
                opObject=opObject,
                resCode=400,
                operator=operator,
                errorMsg=error_msg,
                opDetails=opDetails)
            return {"error": "No such User", "success": False}, 400
        salt = app.config.get("SALT", b"")
        # reset user's passwordop_log_handler = OperatorLogHandler()
        new_password = bcrypt.hashpw(new_password.encode('utf8'),
                                     bytes(salt.encode()))

        user.update_password(new_password.decode())

        data = {
            "success": True
        }

        op_log_handler.record_operating_log(
            opDate=cur_time,
            opName=opName,
            opObject=opObject,
            resCode=200,
            operator=operator,
            opDetails=opDetails)
        return data, 200
