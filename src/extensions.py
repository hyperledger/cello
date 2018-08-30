# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
from celery import Celery
import logging
import os

logger = logging.getLogger(__name__)
BROKER = os.environ.get("BROKER", "")
BACKEND = os.environ.get("BACKEND", "")

celery = Celery('cello-celery', broker=BROKER, backend=BACKEND)
