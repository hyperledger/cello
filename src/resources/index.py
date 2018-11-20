
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import os
import sys

from flask import Blueprint, render_template, session, redirect
from flask import request as r

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import log_handler, LOG_LEVEL, request_debug
from auth import oidc

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

bp_index = Blueprint('bp_index', __name__)

SERVER_PUBLIC_IP = os.environ.get("SERVER_PUBLIC_IP")
KEYCLOAK_REALM = os.environ.get("KEYCLOAK_REALM")
KEYCLOAK_SERVER_PORT = os.environ.get("KEYCLOAK_SERVER_PORT")

LOGOUT_URL = "http://%s:%s/auth/realms/%s/protocol/openid-connect/logout" % (
    SERVER_PUBLIC_IP,
    KEYCLOAK_SERVER_PORT,
    KEYCLOAK_REALM
)
REDIRECT_URL = "http://%s:8080" % SERVER_PUBLIC_IP


@bp_index.route('/', methods=['GET'])
@bp_index.route('/index', methods=['GET'])
@oidc.require_login
def show():
    request_debug(r, logger)
    try:
        username = oidc.user_getfield('preferred_username')
        role = oidc.user_getfield('role')
        tenant = oidc.user_getfield('tenant')
        user_id = oidc.user_getfield('sub')
        is_admin = role == "cello-administrator"
        access_token = oidc.get_access_token()
        if access_token:
            session["token"] = access_token
        else:
            access_token = session["token"]
        token_valid = oidc.validate_token(access_token)
        if not token_valid:
            oidc.logout()
            return redirect('%s?redirect_uri=%s' % (LOGOUT_URL, REDIRECT_URL))
    except Exception as exc:
        logger.error('exc {}'.format(str(exc)))
        oidc.logout()
        return redirect('%s?redirect_uri=%s' % (LOGOUT_URL, REDIRECT_URL))
    else:
        return render_template("index.html",
                               username=username,
                               user_id=user_id,
                               is_admin=is_admin,
                               authority=role,
                               tenant=tenant,
                               access_token=access_token
                               )
