
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import os
import sys

from flask import Blueprint, render_template

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import log_handler, LOG_LEVEL
from flask_login import login_required

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


bp_user_view = Blueprint('bp_user_view', __name__,
                         url_prefix='/{}'.format("view"))


@bp_user_view.route('/users', methods=['GET'])
@login_required
def users():

    return render_template("users.html")
