
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import os
import sys

from flask import Blueprint, render_template
from flask import request as r

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import log_handler, LOG_LEVEL, request_debug
from version import version, homepage, author
from flask_login import login_required, current_user

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

bp_index = Blueprint('bp_index', __name__)


@bp_index.route('/', methods=['GET'])
@bp_index.route('/index', methods=['GET'])
@login_required
def show():
    request_debug(r, logger)
    user_id, username, is_admin, authority = \
        str(current_user.id), current_user.username,\
        current_user.isAdmin, current_user.role

    return render_template("index.html",
                           username=username,
                           user_id=user_id,
                           is_admin=is_admin,
                           authority=authority
                           )


@bp_index.route('/about', methods=['GET'])
@login_required
def about():
    logger.info("path={}, method={}".format(r.path, r.method))
    return render_template("about.html", author=author, version=version,
                           homepage=homepage)
