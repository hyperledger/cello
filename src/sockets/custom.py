#
# SPDX-License-Identifier: Apache-2.0
#
from flask_socketio import Namespace, join_room
import sys
import os
import logging

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import log_handler, LOG_LEVEL

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


class CustomSockets(Namespace):
    def on_connect(self):
        logger.debug("socket is connected")

    def on_disconnect(self):
        logger.debug("socket is disconnected")

    def on_join(self, message):
        join_room(message.get("id", ""))
