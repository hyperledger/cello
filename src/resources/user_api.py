# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import os
import sys

from flask import Blueprint
from flask_restful import Api

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from modules.user import ListUser, CreateUser, UpdateUser, DeleteUser


bp_user_api = Blueprint('bp_user_api', __name__,
                        url_prefix='/{}/{}'.format("api", "user"))

api = Api(bp_user_api)
api.add_resource(ListUser, '/list')
api.add_resource(CreateUser, '/create')
api.add_resource(UpdateUser, '/update/<string:user_id>')
api.add_resource(DeleteUser, '/delete/<string:user_id>')
