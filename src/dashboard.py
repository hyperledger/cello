
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import os
from common import log_handler, LOG_LEVEL
from flask import Flask, render_template
from resources import bp_index, \
    bp_stat_view, bp_stat_api, \
    bp_cluster_view, bp_cluster_api, \
    bp_host_view, bp_host_api

STATIC_FOLDER = os.getenv("STATIC_FOLDER", "themes/basic/static")
TEMPLATE_FOLDER = os.getenv("TEMPLATE_FOLDER", "themes/basic/templates")
app = Flask(__name__, static_folder=STATIC_FOLDER,
            template_folder=TEMPLATE_FOLDER)

app.config.from_object('config.DevelopmentConfig')
app.config.from_envvar('CELLO_CONFIG_FILE', silent=True)

app.logger.setLevel(LOG_LEVEL)
app.logger.addHandler(log_handler)

app.register_blueprint(bp_index)
app.register_blueprint(bp_host_view)
app.register_blueprint(bp_host_api)
app.register_blueprint(bp_cluster_view)
app.register_blueprint(bp_cluster_api)
app.register_blueprint(bp_stat_view)
app.register_blueprint(bp_stat_api)


@app.errorhandler(404)
def page_not_found(error):
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=8080,
        debug=os.environ.get('DEBUG', app.config.get("DEBUG", True)),
        threaded=True)
