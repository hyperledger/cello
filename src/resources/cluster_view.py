import logging
import os
import sys

from flask import Blueprint, render_template
from flask import request as r

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import log_handler, LOG_LEVEL, \
    request_debug, FABRIC_VERSION, \
    CONSENSUS_PLUGINS, CONSENSUS_MODES, CLUSTER_SIZES
from modules import cluster_handler, host_handler

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


bp_cluster_view = Blueprint('bp_cluster_view', __name__,
                            url_prefix='/{}'.format("view"))


# Return a web page with cluster info
@bp_cluster_view.route('/cluster/<cluster_id>', methods=['GET'])
def cluster_info_show(cluster_id):
    logger.debug("/ cluster_info/{}?released={} action={}".format(
        cluster_id, r.args.get('released', '0'), r.method))
    released = (r.args.get('released', '0') != '0')
    if not released:
        return render_template("cluster_info.html",
                               item=cluster_handler.get_by_id(cluster_id),
                               consensus_plugins=CONSENSUS_PLUGINS)
    else:
        return render_template("cluster_info.html",
                               item=cluster_handler.get_by_id(
                                   cluster_id, col_name="released"),
                               consensus_plugins=CONSENSUS_PLUGINS)


# Return a web page with clusters
@bp_cluster_view.route('/clusters', methods=['GET'])
def clusters_show():
    request_debug(r, logger)
    show_type = r.args.get("type", "active")
    col_filter = dict((key, r.args.get(key)) for key in r.args if
                      key != "col_name" and key != "page" and key != "type")
    if show_type != "released":
        col_name = r.args.get("col_name", "active")
    else:
        col_name = r.args.get("col_name", "released")

    if show_type == "inused":
        col_filter["user_id"] = {"$ne": ""}

    clusters = list(cluster_handler.list(filter_data=col_filter,
                                         col_name=col_name))
    if show_type == "active":
        clusters.sort(key=lambda x: str(x["create_ts"]), reverse=True)
    elif show_type == "inused":
        clusters.sort(key=lambda x: str(x["apply_ts"]), reverse=True)
    else:
        clusters.sort(key=lambda x: str(x["release_ts"]), reverse=True)
    total_items = len(clusters)

    hosts = list(host_handler.list())
    hosts_avail = list(filter(lambda e: e["status"] == "active" and len(
        e["clusters"]) < e["capacity"], hosts))
    return render_template("clusters.html", type=show_type, col_name=col_name,
                           items_count=total_items, items=clusters,
                           hosts_available=hosts_avail,
                           fabric_version=FABRIC_VERSION,
                           consensus_plugins=CONSENSUS_PLUGINS,
                           consensus_modes=CONSENSUS_MODES,
                           cluster_sizes=CLUSTER_SIZES)
