# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import os
import sys
import bcrypt

from flask import Blueprint, redirect, url_for
from flask import request as r
from flask import current_app as app
from flask_login import login_user, logout_user

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import log_handler, LOG_LEVEL, \
    request_get, make_ok_resp, make_fail_resp, \
    request_debug, request_json_body, \
    CODE_CREATED, CODE_NOT_FOUND
from .user import User

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

bp_auth_api = Blueprint('bp_auth_api', __name__,
                        url_prefix='/{}/{}'.format("api", "auth"))


@bp_auth_api.route('/register', methods=['POST'])
def register():
    request_debug(r, logger)
    if not r.form["username"] or not r.form["password"]:
        error_msg = "register without enough data"
        logger.warning(error_msg)
        return make_fail_resp(error=error_msg, data=r.form)

    username, password = r.form["username"], r.form["password"]
    salt = app.config.get("SALT", b"")
    password = bcrypt.hashpw(password.encode('utf8'), bytes(salt.encode()))

    try:
        user = User(username, password)
        user_id = user.save()
        user = user.get_by_id(user_id)
        data = {
            "username": user.username,
            "apikey": str(user.id),
            "isActivated": user.active,
            "balance": user.balance,
            "success": True
        }
        return make_ok_resp(code=CODE_CREATED, data=data)
    except Exception as exc:
        logger.info("exc %s", exc)
        return make_fail_resp(error="register failed")


@bp_auth_api.route('/login', methods=['POST'])
def login():
    if not r.form["username"] or not r.form["password"]:
        error_msg = "login without enough data"
        logger.warning(error_msg)
        return make_fail_resp(error=error_msg, data={'success': False})

    username, password = r.form["username"], r.form["password"]
    user_obj = User()
    try:
        user = user_obj.get_by_username_w_password(username)
        if bcrypt.checkpw(password.encode('utf8'),
                          bytes(user.password.encode())):
            login_user(user)
            user_id = str(user.id)
            return make_ok_resp(data={'success': True,
                                      'id': user_id,
                                      'next': url_for('bp_index.show')},
                                code=CODE_CREATED)
        else:
            return make_fail_resp(error="login failed",
                                  data={'success': False})
    except Exception:
        return make_fail_resp(error="login failed", data={'success': False})


@bp_auth_api.route('/logout', methods=['GET'])
def logout():
    logout_user()
    return redirect(url_for('bp_index.show'))


@bp_auth_api.route('/user/account/<user_id>', methods=['GET'])
def account(user_id):
    if not user_id:
        return make_fail_resp(error="no user id", data={"success": False})
    user_obj = User()
    user = user_obj.get_by_id(user_id)
    if not user:
        return make_fail_resp(error="no such user", data={"success": False})

    data = {
        "username": user.username,
        "apikey": str(user.id),
        "isActivated": user.active,
        "balance": user.balance
    }

    return make_ok_resp(data=data)
