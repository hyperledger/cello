# Copyright 2017 (c) VMware, Inc. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import datetime
import logging
import os
import sys
from pyVmomi import vim

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import db, log_handler, LOG_LEVEL, VCENTER, \
    VC_DATASTORE, VC_DATACENTER, NETWORK, TEMPLATE, VC_CLUSTER

from agent import reset_container_host, check_daemon, \
    create_vm, delete_vm, check_vc_resource, \
    initializesi

from ..host_base import HostBase

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


class VsphereHost(HostBase):
    """ Main handler to operate the vSphere hosts
    """

    def __init__(self):
        self.collection = db["host"]

    def create(self, vcip, username, pwd, port, params):
        """ Create a new vSphere host
        :param vcip : vCenter address
        :param username: vCenter username
        :param pwd: vCenter password
        :param port:
        :param params: params to create vm
        :return:
        """
        # Init connection
        try:
            si = initializesi(vcip, username, pwd, port)
            connection = si.RetrieveContent()
            vc_resources = params.get(VCENTER)

        except Exception as e:
            error_msg = (
                "Cannot complete login due to"
                " an incorrect user name or password."
            )
            raise Exception(error_msg)

        # Check cluster
        cluster = check_vc_resource(connection,
                                    [vim.ClusterComputeResource],
                                    vc_resources[VC_CLUSTER])
        if cluster is None:
            error_msg = (
                "The Cluster: {} does not exist"
                " or exception is raised."
            ).format(vc_resources[VC_CLUSTER])

            logger.error(error_msg)
            raise Exception(error_msg)

        else:
            vc_resources[VC_CLUSTER] = cluster

        # Check datacenter
        datacenter = check_vc_resource(connection,
                                       [vim.Datacenter],
                                       vc_resources[VC_DATACENTER])
        if datacenter is None:
            error_msg = (
                "The DataCenter: {} does not exist"
                " or exception is raised."
            ).format(vc_resources[VC_DATACENTER])

            logger.error(error_msg)
            raise Exception(error_msg)

        else:
            vc_resources[VC_DATACENTER] = datacenter

        # Check datastore
        datastore = check_vc_resource(connection,
                                      [vim.Datastore],
                                      vc_resources[VC_DATASTORE])
        if datastore is None:
            error_msg = (
                "The Datastore: {} does not exist"
                " or exception is raised."
            ).format(vc_resources[VC_DATASTORE])

            logger.error(error_msg)
            raise Exception(error_msg)

        else:
            vc_resources[VC_DATASTORE] = datastore

        # Check template
        template = check_vc_resource(connection,
                                     [vim.VirtualMachine],
                                     vc_resources[TEMPLATE])
        if template is None:
            error_msg = (
                "The template: {} does not exist"
                " or exception is raised."
            ).format(vc_resources[TEMPLATE])

            logger.error(error_msg)
            raise Exception(error_msg)

        else:
            vc_resources[TEMPLATE] = template

        # Check network
        network = check_vc_resource(connection,
                                    [vim.Network],
                                    vc_resources[NETWORK])
        if network is None:
            error_msg = (
                "The network: {} does not exist"
                " or exception is raised."
            ).format(vc_resources[NETWORK])

            logger.error(error_msg)
            raise Exception(error_msg)

        else:
            vc_resources[NETWORK] = network

        create_vm(connection, params)
        return True

    def delete(self, vmuuid, vcip, username, pwd, port=443):
        """ Delete a host instance

        :param vmuuid: Identify of vm
        :param vcip vCenter ip
        :param username vCenter  username
        :param pwd vCenter password
        :param port vCenter port
        :return:
        """
        return delete_vm(vcip, username, pwd, port, vmuuid)

    def reset(self, worker_api, host_type='docker'):
        """
        Clean a host's free clusters.
        :param worker_api:
        :param host_type:
        :return:
        """
        return reset_container_host(host_type=host_type,
                                    worker_api=worker_api)

    def refresh_status(self, worker_api):
        """
        Refresh the status of the host

        :param worker_api: the host of vm
        :return: the status of the host
        """
        return check_daemon(worker_api)
