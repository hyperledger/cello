import logging
import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from flask import Blueprint, jsonify, render_template
from flask import request as r
from common import log_handler, LOG_LEVEL, CODE_OK, request_debug
from version import version
from modules import host_handler, stat_handler

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


bp_stat_api = Blueprint('bp_stat_api', __name__, url_prefix='/api')


@bp_stat_api.route('/health', methods=['GET'])
def health():
    request_debug(r, logger)
    result = {
        'health': 'OK',
        'version': version
    }

    return jsonify(result), CODE_OK


@bp_stat_api.route('/stat', methods=['GET'])
def get():
    request_debug(r, logger)
    res = r.args.get('res')
    if res == 'host':
        result = stat_handler.hosts()
    elif res == 'cluster':
        result = stat_handler.clusters()
    else:
        result = {
            'example': '/api/stat?res=host'
        }

    logger.debug(result)
    return jsonify(result), CODE_OK


bp_stat_view = Blueprint('bp_stat_view', __name__, url_prefix='/view')


@bp_stat_view.route('/stat', methods=['GET'])
def show():
    logger.info("path={}, method={}".format(r.path, r.method))
    hosts = list(host_handler.list())

    return render_template("stat.html", hosts=hosts)
