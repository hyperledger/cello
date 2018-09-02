# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import logging
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from modules import cluster_handler
from extensions import celery
from exceptions import ReleaseClusterException, DeleteClusterException

logger = logging.getLogger(__name__)


@celery.task(name="release_cluster", bind=True,
             default_retry_delay=5, max_retries=3)
def release_cluster(self, cluster_id):
    if cluster_handler.release_cluster(cluster_id):
        logger.info("release cluster {} successfully".format(cluster_id))
        return True
    else:
        self.retry(exc=ReleaseClusterException)


@celery.task(name="delete_cluster", bind=True,
             default_retry_delay=5, max_retries=3)
def delete_cluster(self, cluster_id, status):
    if status == "active":
        result = cluster_handler.delete(id=cluster_id)
    else:
        result = cluster_handler.delete_released(id=cluster_id)

    if result:
        return True

    self.retry(exc=DeleteClusterException)
