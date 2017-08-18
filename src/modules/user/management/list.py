
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
from flask_restful import Resource, reqparse, fields, marshal_with
from flask_login import login_required
import logging
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from common import log_handler, LOG_LEVEL
from resources.models import User as UserModel
import time

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


user_fields = {
    "id": fields.String,
    "name": fields.String,
    "isAdmin": fields.Boolean,
    "role": fields.Integer,
    "active": fields.Boolean,
    "balance": fields.Integer,
    "timestamp": fields.Integer
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
    @login_required
    @marshal_with(user_list_fields)
    def get(self, **kwargs):
        args = user_list_parser.parse_args()
        page = args['pageNo']
        per_page = args['pageSize']
        sort_columns = args['sortColumns']
        sort_columns = sort_columns.split(" ")
        sort_str = ''
        if len(sort_columns) > 1:
            sort_type = sort_columns[1]
            sort_field = sort_columns[0]
            if sort_type == "desc":
                sort_str = "-%s" % sort_field
            else:
                sort_str = sort_field
        offset = (page - 1) * per_page

        user_count = UserModel.objects.all().count()
        users = \
            UserModel.objects.skip(offset).limit(per_page).order_by(sort_str)

        users = [{
            "id": str(user.id),
            "name": user.username,
            "isAdmin": user.isAdmin,
            "role": user.role,
            "active": user.active,
            "balance": user.balance,
            "timestamp": time.mktime(user.timestamp.timetuple())
        } for user in users]

        result = {
            "users": {
                "result": users,
                "totalCount": user_count,
                "pageSize": per_page,
                "pageNo": page
            },
        }

        return result, 200
