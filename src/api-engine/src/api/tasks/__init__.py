from __future__ import absolute_import, unicode_literals
from api_engine.celery import app

import logging

LOG = logging.getLogger(__name__)


@app.task()
def create_node():
    return True
