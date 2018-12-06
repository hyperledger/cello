
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import time
import logging

from threading import Thread

from modules import host_handler, cluster_handler
from common import LOG_LEVEL, log_handler, NETWORK_STATUS_RUNNING
from parse_client.connection import register
import os

APP_ID = os.environ.get("PARSE_SERVER_APPLICATION_ID")
MASTER_KEY = os.environ.get("PARSE_SERVER_MASTER_KEY")
REST_API_KEY = os.environ.get("PARSE_SERVER_REST_API_KEY")

register(APP_ID, REST_API_KEY, master_key=MASTER_KEY)
PERIOD_TIME = int(os.getenv('PERIOD_TIME', 15))

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


def network_check_health(net_id, retries=60, period=5):
    """
    Check the chain health. If not healthy, will reset the chain

    :param net_id: id of the chain
    :param retries: how many retries before thinking not health
    :param period: wait between two retries
    :return:
    """
    net = cluster_handler.get_by_id(net_id)
    if not net:
        logger.warning("Not find chain {}".format(net_id))
        return
    if net.get("status") != NETWORK_STATUS_RUNNING:  # check running one
        return
    net_name = net.get("name")
    logger.debug("Chain {}/{}: checking health".format(net_name, net_id))

    # free or used by user, then check its health
    for i in range(retries):
        if cluster_handler.refresh_health(net_id):  # chain is healthy
            return
        else:
            logger.debug("Health Check {}: cluster {}/{} is unhealthy!".format(
                i, net_name, net_id))
            time.sleep(period)
    logger.warning("Chain {}/{} is unhealthy!".format(net_name, net_id))
    # only reset free chains
    if cluster_handler.get_by_id(net_id).get("user_id") == "":
        logger.info("Timeout....resetting free unhealthy chain {}/{}".format(
            net_name, net_id))
        cluster_handler.reset_free_one(net_id)


def host_check_networks(host_id):
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
        t = Thread(target=network_check_health, args=(c.get("id"),))
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
            host_check_networks(host_id)
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
    watch_run(PERIOD_TIME)
