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
from flask_login import login_required
from flask_login import login_user, logout_user

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import log_handler, LOG_LEVEL, \
    request_get, make_ok_resp, make_fail_resp, \
    request_debug, request_json_body, \
    CODE_CREATED, CODE_NOT_FOUND
from .user import User
from .models import User as UserModel
from .models import ADMIN
import time

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

bp_user_api = Blueprint('bp_user_api', __name__,
                        url_prefix='/{}/{}'.format("api", "user"))


@bp_user_api.route('/list', methods=['GET'])
@login_required
def list_user():
    request_debug(r, logger)
    f = {}
    f.update(r.args.to_dict())
    page = int(f.get("pageNo", 1))
    per_page = int(f.get("pageSize", 10))
    sort_columns = f.get("sortColumns", "")
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
    users = UserModel.objects.skip(offset).limit(per_page).order_by(sort_str)

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

    return make_ok_resp(data=result)


@bp_user_api.route('/create', methods=['POST'])
@login_required
def create_user():
    request_debug(r, logger)
    if not r.form["username"] or not r.form["password"] \
            or not r.form["role"]:
        error_msg = "create user without enough data"
        logger.warning(error_msg)
        return make_fail_resp(error=error_msg, data=r.form)

    username, password = r.form["username"], r.form["password"]
    role, active = int(r.form["role"]), r.form["active"]
    balance = int(r.form["balance"])
    active = active == "true"
    salt = app.config.get("SALT", b"")
    password = bcrypt.hashpw(password.encode('utf8'), bytes(salt.encode()))

    try:
        user = User(username, password, is_admin=role == ADMIN,
                    role=role, active=active, balance=balance)
        user.save()
        return make_ok_resp(code=CODE_CREATED)
    except Exception as exc:
        logger.info("exc %s", exc)
        return make_fail_resp(error="create user failed")


@bp_user_api.route('/update/<user_id>', methods=['PUT'])
@login_required
def update_user(user_id):
    request_debug(r, logger)
    if not r.form["username"] or not r.form["password"] \
            or not r.form["role"]:
        error_msg = "create user without enough data"
        logger.warning(error_msg)
        return make_fail_resp(error=error_msg, data=r.form)

    username, role = r.form["username"], int(r.form["role"])
    balance = int(r.form["balance"])
    active = r.form["active"]
    active = active == "true"
    try:
        UserModel.objects(id=user_id).update(set__username=username,
                                             set__active=active,
                                             set__balance=balance,
                                             set__role=role, upsert=True)
    except Exception as exc:
        error_msg = exc.message
        logger.warning(error_msg)
        return make_fail_resp(error=error_msg, data=r.form)

    return make_ok_resp(data={})


@bp_user_api.route('/delete/<user_id>', methods=['DELETE'])
@login_required
def delete_user(user_id):
    request_debug(r, logger)
    try:
        user = UserModel.objects.get(id=user_id)
    except Exception:
        pass
    else:
        user.delete()

    return make_ok_resp(data={})
