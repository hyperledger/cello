
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
from common import log_handler, LOG_LEVEL, NETWORK_TYPES, CONSENSUS_PLUGINS, \
    CONSENSUS_MODES, WORKER_TYPES, NETWORK_SIZE_FABRIC_PRE_V1, request_debug, \
    CLUSTER_LOG_TYPES, CLUSTER_LOG_LEVEL

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

bp_login = Blueprint('bp_login', __name__)


@bp_login.route('/login', methods=['GET'])
def login():
    request_debug(r, logger)

    return render_template("login.html")
