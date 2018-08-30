# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
from extensions import celery
import logging
from modules import cluster_handler

logger = logging.getLogger(__name__)


@celery.task()
def release_cluster(cluster_id):
    if cluster_handler.release_cluster(cluster_id):
        logger.info("release cluster successfully")
        return True
