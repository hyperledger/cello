# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import os
import sys

from flask import Blueprint, redirect
from flask_restful import Api

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from modules.user import ListUser, CreateUser, UpdateUser, \
    DeleteUser, Register, Login, UserInfo, UserProfile, UserSearch
from auth import oidc

SERVER_PUBLIC_IP = os.environ.get("SERVER_PUBLIC_IP")
KEYCLOAK_REALM = os.environ.get("KEYCLOAK_REALM")
KEYCLOAK_SERVER_PORT = os.environ.get("KEYCLOAK_SERVER_PORT")

LOGOUT_URL = "http://%s:%s/auth/realms/%s/protocol/openid-connect/logout" % (
    SERVER_PUBLIC_IP,
    KEYCLOAK_SERVER_PORT,
    KEYCLOAK_REALM
)
REDIRECT_URL = "http://%s:8080" % SERVER_PUBLIC_IP


bp_user_api = Blueprint('bp_user_api', __name__,
                        url_prefix='/{}/{}'.format("api", "user"))
bp_auth_api = Blueprint('bp_auth_api', __name__,
                        url_prefix='/{}/{}'.format("api", "auth"))
front_rest_user_v2 = Blueprint('front_rest_user_v2', __name__,
                               url_prefix='/{}/{}'.format("api", "v2"))


auth_api = Api(bp_auth_api)
auth_api.add_resource(Register, '/register')
auth_api.add_resource(Login, '/login')


@bp_auth_api.route('/logout', methods=['GET'])
def logout():
    oidc.logout()
    return redirect('%s?redirect_uri=%s' % (LOGOUT_URL, REDIRECT_URL))


user_api = Api(bp_user_api)
user_api.add_resource(ListUser, '/list')
user_api.add_resource(CreateUser, '/create')
user_api.add_resource(UpdateUser, '/update/<string:user_id>')
user_api.add_resource(DeleteUser, '/delete/<string:user_id>')
user_api.add_resource(UserInfo, '/account/<string:user_id>')
user_api.add_resource(UserSearch, '/search', endpoint="search")

front_user_api = Api(front_rest_user_v2)
front_user_api.add_resource(UserProfile, '/profile/<string:user_id>')
