import logging
import os
import sys

from flask import Blueprint, render_template
from flask import request as r

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import log_handler, LOG_LEVEL, \
    HOST_TYPES, request_debug, \
    CLUSTER_LOG_TYPES, CLUSTER_LOG_LEVEL
from modules import host_handler

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


bp_host_view = Blueprint('bp_host_view', __name__,
                         url_prefix='/{}'.format("view"))


@bp_host_view.route('/hosts', methods=['GET'])
def hosts_show():
    logger.info("/hosts method=" + r.method)
    request_debug(r, logger)
    col_filter = dict((key, r.args.get(key)) for key in r.args)
    items = list(host_handler.list(filter_data=col_filter))
    items.sort(key=lambda x: str(x["name"]), reverse=True)
    logger.debug(items)

    return render_template("hosts.html",
                           items_count=len(items),
                           items=items,
                           host_types=HOST_TYPES,
                           log_types=CLUSTER_LOG_TYPES,
                           log_levels=CLUSTER_LOG_LEVEL,
                           )


@bp_host_view.route('/host/<host_id>', methods=['GET'])
def host_info(host_id):
    logger.debug("/ host_info/{0} method={1}".format(host_id, r.method))
    return render_template("host_info.html", item=host_handler.get_by_id(
        host_id))
