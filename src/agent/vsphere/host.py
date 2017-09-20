# Copyright 2017 (c) VMware, Inc. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import datetime
import logging
import os
import sys
from pyVmomi import vim
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from ..host_base import HostBase
from agent import reset_container_host, \
    check_vc_resource, create_vm, delete_vm, \
    check_vm_status, check_connection

from common import db, log_handler, LOG_LEVEL

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


class VsphereHost(HostBase):
    """ Main handler to operate the VMs in vSphere
    """
    def __init__(self):
        self.collection = db["host"]

    def create(self, vcip, username, pwd, port, paras):

        """ Create a new vSphere host node
        :param vcip: vcenter ip
        :param username : vcenter username
        :param pwd: vcenter password
        :param port: vcenter port default is 443
        :param paras: a dic include all attributes to create a vm
        :return:
        """

        vmname = paras.get("vmname")
        cluster = paras.get("cluster")
        datacenter = paras.get("datacenter")
        datastore = paras.get("datastore")
        template = paras.get("template")

#       check virtual machine name
        res = check_vc_resource(vcip, username, pwd, port,
                                [vim.VirtualMachine], vmname)
        if res is not None:
            logger.error("vmname is duplicated.")
            return False

#       check cluster
        res = check_vc_resource(vcip, username, pwd, port,
                                [vim.ClusterComputeResource], cluster)
        if res is None:
            logger.error("Resourceool does not exist")
            return False

#       check datacenter
        res = check_vc_resource(vcip, username, pwd, port,
                                [vim.Datacenter], datacenter)
        if res is None:
            logger.error("DataCenter:{} doesn't exist.".format(datacenter))
            return False

#       check datastore
        res = check_vc_resource(vcip, username, pwd, port,
                                [vim.Datastore], datastore)
        if res is None:
            logger.error("Datastore:{} doesn't exist.".format(datastore))
            return False

#       check template
        res = check_vc_resource(vcip, username, pwd, port,
                                [vim.VirtualMachine], template)
        print(res)
        if res is None:
            logger.error("Template: {} does not exist.".format(template))
            return False

#       check connnection
        if not check_connection(vcip, username, pwd, port):
            logger.error("can not get connection please check args")
            return False

        create_vm(vcip, username, pwd, port, paras)
        return

    def delete(self, vmuuid, vcip, username, pwd, port):
        """ Delete a host instance

        :param vmuuid:
        :param host vcenter username
        :param pwd vcenter  password
        :param port vcenter port
        :return:
        """
        if not check_connection(vcip, username, pwd, port):
            logger.error("can not get connection to the \
                         Vcenter please check args")
            return False

        return delete_vm(vcip, username, pwd, port, vmuuid)

    def reset(self, worker_api, host_type='docker'):
        """
        Clean a host's free clusters.

        :param id: host id
        :return: True or False
        """
        return reset_container_host(host_type=host_type, worker_api=worker_api)

    def is_active(self, vmuuid, vcip, username, pwd, port):

        return check_vm_status(vcip, username, pwd, port, vmuuid)
