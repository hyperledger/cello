
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
from common import log_handler, LOG_LEVEL, NETWORK_TYPES, \
    CONSENSUS_MODES, WORKER_TYPES, \
    CONSENSUS_PLUGINS_FABRIC_V1, \
    NETWORK_SIZE_FABRIC_PRE_V1, \
    request_debug, \
    CLUSTER_LOG_TYPES, CLUSTER_LOG_LEVEL
from version import version, homepage, author
from flask_login import login_required, current_user

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

from modules import cluster_handler, host_handler

bp_index = Blueprint('bp_index', __name__)


@bp_index.route('/', methods=['GET'])
@bp_index.route('/index', methods=['GET'])
@login_required
def show():
    request_debug(r, logger)
    hosts = list(host_handler.list(filter_data={}))
    hosts.sort(key=lambda x: x["name"], reverse=False)
    hosts_active = list(filter(lambda e: e["status"] == "active", hosts))
    hosts_inactive = list(filter(lambda e: e["status"] != "active", hosts))
    hosts_free = list(filter(
        lambda e: len(e["clusters"]) < e["capacity"], hosts_active))
    hosts_available = hosts_free
    clusters_active = len(list(cluster_handler.list(col_name="active")))
    clusters_released = len(list(cluster_handler.list(col_name="released")))
    clusters_free = len(list(cluster_handler.list(filter_data={"user_id": ""},
                                                  col_name="active")))
    clusters_inuse = clusters_active - clusters_free

    clusters_temp = len(list(cluster_handler.list(filter_data={
        "user_id": "/^__/"}, col_name="active")))
    username, is_admin = current_user.username, current_user.isAdmin

    return render_template("index.html", hosts=hosts,
                           hosts_free=hosts_free,
                           hosts_active=hosts_active,
                           hosts_inactive=hosts_inactive,
                           hosts_available=hosts_available,
                           clusters_active=clusters_active,
                           clusters_released=clusters_released,
                           clusters_free=clusters_free,
                           clusters_inuse=clusters_inuse,
                           clusters_temp=clusters_temp,
                           cluster_sizes=NETWORK_SIZE_FABRIC_PRE_V1,
                           network_type=NETWORK_TYPES,
                           consensus_plugins=CONSENSUS_PLUGINS_FABRIC_V1,
                           consensus_modes=CONSENSUS_MODES,
                           host_types=WORKER_TYPES,
                           log_types=CLUSTER_LOG_TYPES,
                           log_levels=CLUSTER_LOG_LEVEL,
                           username=username,
                           is_admin=is_admin
                           )


@bp_index.route('/about', methods=['GET'])
def about():
    logger.info("path={}, method={}".format(r.path, r.method))
    return render_template("about.html", author=author, version=version,
                           homepage=homepage)
