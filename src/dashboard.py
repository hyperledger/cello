# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import os

from flask import Flask, jsonify
from flask_socketio import SocketIO
from mongoengine import connect

from common import log_handler, LOG_LEVEL
from resources import bp_index, \
    bp_stat_api, \
    bp_cluster_api, \
    bp_host_api, bp_auth_api, \
    bp_user_api, front_rest_user_v2
from sockets.custom import CustomSockets
from extensions import celery
from auth import oidc


logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

STATIC_FOLDER = "static"
TEMPLATE_FOLDER = "templates"
app = Flask(__name__, static_folder=STATIC_FOLDER,
            template_folder=TEMPLATE_FOLDER)
socketio = SocketIO(app)

app.config.from_object('config.DevelopmentConfig')
app.config.from_envvar('CELLO_CONFIG_FILE', silent=True)

oidc.init_app(app)
celery.conf.update(app.config)

connect(app.config.get("MONGODB_DB", "dashboard"),
        host=app.config.get("MONGODB_HOST", "mongo"),
        username=app.config.get("MONGODB_USERNAME", ""),
        password=app.config.get("MONGODB_PASSWORD", ""),
        connect=False, tz_aware=True)

app.logger.setLevel(LOG_LEVEL)
app.logger.addHandler(log_handler)

app.register_blueprint(bp_index)
app.register_blueprint(bp_host_api)
app.register_blueprint(bp_cluster_api)
app.register_blueprint(bp_stat_api)
app.register_blueprint(bp_auth_api)
app.register_blueprint(bp_user_api)
app.register_blueprint(front_rest_user_v2)


@app.errorhandler(404)
def page_not_found(error):
    return jsonify(error=404, text=str(error)), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify(error=500, text=str(error)), 500


socketio.on_namespace(CustomSockets('/socket.io'))

if __name__ == '__main__':
    socketio.run(app, port=8080, host="0.0.0.0",
                 debug=os.environ.get('DEBUG', app.config.get("DEBUG", True)))
