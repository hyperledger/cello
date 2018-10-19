# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

from flask_oidc import OpenIDConnect
import logging
from functools import wraps
from flask import g
import json

from common import LOG_LEVEL, log_handler

oidc = OpenIDConnect()
logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


def role_required(roles=None):
    def wrapper(view_func):
        @wraps(view_func)
        def decorated(*args, **kwargs):
            role = g.oidc_token_info.get('role', 'user')
            response_body = {'error': 'no_permission',
                             'error_description': 'have no permission'}
            if roles is None or role not in roles:
                response_body = json.dumps(response_body)
                return response_body, 401, {'WWW-Authenticate': 'Bearer'}

            return view_func(*args, **kwargs)

        return decorated

    return wrapper
