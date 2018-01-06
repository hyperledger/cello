
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import time
import logging

from threading import Thread

from modules import host_handler, cluster_handler
from common import LOG_LEVEL, log_handler, SYS_DELETER, SYS_USER
from mongoengine import connect
import os

MONGODB_DB = os.getenv('MONGODB_DB', 'dashboard')
MONGODB_HOST = os.getenv('MONGODB_HOST', 'mongo')
MONGODB_PORT = int(os.getenv('MONGODB_PORT', 27017))
MONGODB_USERNAME = os.getenv('MONGODB_USERNAME', '')
MONGODB_PASSWORD = os.getenv('MONGODB_PASSWORD', '')

connect(MONGODB_DB, host=MONGODB_HOST, username=MONGODB_USERNAME,
        password=MONGODB_PASSWORD, connect=False, tz_aware=True)

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


def chain_check_health(chain_id, retries=3, period=5):
    """
    Check the chain health.

    :param chain_id: id of the chain
    :param retries: how many retries before thinking not health
    :param period: wait between two retries
    :return:
    """
    chain = cluster_handler.get_by_id(chain_id)
    if not chain:
        logger.warning("Not find chain {}".format(chain_id))
        return
    chain_user_id = chain.get("user_id")
    chain_name = chain.get("name")
    logger.debug("Chain {}/{}: checking health".format(chain_name, chain_id))

    # we should never process in-processing chains unless deleting one
    if chain_user_id.startswith(SYS_USER):
        if chain_user_id.startswith(SYS_DELETER):  # in system processing, TBD
            for i in range(retries):
                time.sleep(period)
                if cluster_handler.get_by_id(chain_id).get("user_id") != \
                        chain_user_id:
                    return
            logger.info("Delete in-deleting chain {}/{}".format(
                chain_name, chain_id))
            cluster_handler.delete(chain_id)
        return

    logger.info("will refresh health")
    # free or used by user, then check its health
    for i in range(retries):
        if cluster_handler.refresh_health(chain_id):  # chain is healthy
            return
        else:
            time.sleep(period)
    logger.warning("Chain {}/{} is unhealthy!".format(chain_name, chain_id))
    # only reset free chains
    if cluster_handler.get_by_id(chain_id).get("user_id") == "":
        logger.info("Resetting free unhealthy chain {}/{}".format(
            chain_name, chain_id))
        cluster_handler.reset_free_one(chain_id)


def host_check_chains(host_id):
    """
    Check the chain health on the host.

    :param host_id:
    :return:
    """
    host = host_handler.get_by_id(host_id)
    logger.debug("Host {}/{}: checking chains".format(
        host.name, host_id))
    clusters = cluster_handler.list(filter_data={
        "status": "running"})
    for c in clusters:  # concurrent health check is safe for multi-chains
        t = Thread(target=chain_check_health, args=(c.get("id"),))
        t.start()
        t.join(timeout=15)


def host_check_fillup(host_id):
    """
    Check one host.

    :param host_id:
    :return:
    """
    host = host_handler.get_by_id(host_id)
    if host.autofill:
        logger.info("Host {}/{}: checking auto-fillup".format(
            host_handler.get_by_id(host_id).name, host_id))
        host_handler.fillup(host_id)


def host_check(host_id, retries=3, period=3):
    """
    Run check on specific host.
    Check status and check each chain's health.

    :param host_id: id of the checked host
    :param retries: how many retries before thnking it's inactive
    :param period: retry wait
    :return:
    """
    for _ in range(retries):
        if host_handler.refresh_status(host_id):  # host is active
            logger.debug("Host {}/{} is active, start checking".format(
                host_handler.get_by_id(host_id).name, host_id))
            host_check_chains(host_id)
            time.sleep(period)
            host_check_fillup(host_id)
            break
        time.sleep(period)


def watch_run(period=15):
    """
    Run the checking in period.

    :param period: Wait period between two checking
    :return:
    """
    while True:
        logger.info("Watchdog run checks with period = %d s", period)
        hosts = list(host_handler.list())
        logger.info("Found {} hosts".format(len(hosts)))
        for h in hosts:  # operating on different host is safe
            t = Thread(target=host_check, args=(h.get("id"),))
            t.start()
            t.join(timeout=2 * period)
        time.sleep(period)


if __name__ == '__main__':
    watch_run()
