# Copyright 2017 (c) VMware, Inc. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import sys
import os
import logging
import threading
import datetime
import ssl
from pyVmomi import vim
from pyVim.connect import SmartConnect, Disconnect
from pymongo.collection import ReturnDocument
import atexit

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from common import log_handler, LOG_LEVEL, db

context = ssl.SSLContext(ssl.PROTOCOL_SSLv23)
context.verify_mode = ssl.CERT_NONE
# ignore failure of certificate verification.

DEFAULT_PORT = 443

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

col = db["host"]


def check_connection(vcip, username, pwd, port):
    """
    check whether the connections args is useful
    :param vcip: vc ip
    :param username: vc username
    :param pwd: vc password
    :param port: vc port default 443
    :return:
    """
    try:
        initializesi(vcip, username, pwd, port)
        return True
    except Exception as e:
        logger.error(e)
        return False


def check_vc_resource(vcip, username, pwd, port, resource_type, arg):
    """
    check args of new virtual machine confs
    :param vcip:
    :param username:
    :param pwd:
    :param port:
    :param resource: vim TYPE
    :param arg: parameter
    :return:
    """
    try:
        si = initializesi(vcip, username, pwd, port)
        content = si.RetrieveContent()
        res = check_object(content, resource_type, arg)
        return res
    except Exception as e:
        logger.error(e)
        return None


def check_object(content, vimtype, name):
    """
    judge object weather exist in Vcenter
    :param content:
    :param vimtype:   object type
    :param name:  object name
    :return:
    """
    obj = None
    container = content.viewManager.CreateContainerView(
        content.rootFolder, vimtype, True)
    for c in container.view:
        if name:
            if c.name == name:
                obj = c
                break
    return obj


def initializesi(vcip, username, pwd, port):
    """
    initial the connection of the Vcenter
    :param vcip:
    :param username:
    :param pwd:
    :param port:
    :return:
    """
    if port == DEFAULT_PORT:
        si = SmartConnect(host=vcip, user=username, pwd=pwd,
                          sslContext=context)
    else:
        si = SmartConnect(host=vcip, user=username, pwd=pwd, port=port,
                          sslContext=context)
    atexit.register(Disconnect, si)
    return si


def create_vm(vcip, username, pwd, port, args):
    """
    start a thread to create vm and will update db
    :param host:
    :param username:
    :param pwd:
    :param port:
    :param args:
    :return:
    """
    t = threading.Thread(target=setup_vm,
                         args=(vcip, username, pwd, port, args),
                         name="setupvm")
    t.start()


def setup_vm(vcip, username, pwd, port, args):
    """
    setup  a new vritualmachine
    :param host:
    :param username:
    :param pwd:
    :param port:
    :param args:
    :return:
    """
    try:

        si = initializesi(vcip, username, pwd, port)
        content = si.RetrieveContent()
        template = check_object(content, [vim.VirtualMachine],
                                args.get("template"))
        datacenter = check_object(content, [vim.Datacenter],
                                  args.get("datacenter"))
        cluster = check_object(content, [vim.ClusterComputeResource],
                               args.get("cluster"))
        datastore = check_object(content, [vim.Datastore],
                                 args.get("datastore"))
        destfolder = datacenter.vmFolder

        # relocateSpec
        relocatespec = vim.vm.RelocateSpec()
        relocatespec.datastore = datastore
        relocatespec.pool = cluster.resourcePool

        clonespec = vim.vm.CloneSpec()
        clonespec.location = relocatespec
        clonespec.powerOn = True

        host = {
            'vm_uuid': '',
            'vm_name': args.get('vmname'),
            'vc_username': username,
            'vc_password': pwd,
            'vc_address': vcip,
            'datastore': datastore,
            'datacenter': datacenter,
        }

        task = template.Clone(folder=destfolder, name=args.get("vmname"),
                              spec=clonespec)

        if wait_for_task(task):
            vm = check_object(content, [vim.VirtualMachine],
                              args.get("vmname"))
            uuid = vm.summary.config.uuid
            ip = vm.summary.guest.ipAddress
            vm_cpus = vm.summary.config.numCpu
            vm_memory = vm.summary.config.memorySizeMB
            status = "running"
            host.update(temp={
                        'vm_ip': ip,
                        'vm_cpus': vm_cpus,
                        'vm_memory': vm_memory,
                        'status': status})
            host['vm_uuid'] = uuid
            hid = col.insert_one(host).inserted_id
            host = db_update_one(
                {"_id": hid},
                {"$set": {"id": str(hid)}})
            logger.info(host)
        else:
            host["status"] = "error"
            hid = col.insert_one(host).inserted_id
            db_update_one({"_id": hid}, {"$set": {"id": str(hid)}})
            logger.info(host)
    except Exception as e:
        logger.error("Exception happens")
        logger.error(e)
        host["status"] = "error"
        hid = col.insert_one(host).inserted_id
        db_update_one({"_id": hid},
                      {"$set": {"id": str(hid)}})
        return


def wait_for_task(task):
    """
    wait for a vCenter task to finish
    :param task:
    :return:
    """
    task_done = False
    while not task_done:
        if task.info.state == 'success':
            return True

        if task.info.state == 'error':
            logger.error("there was an error")
            return False


def delete_vm(vcip, username, pwd, port, uuid):
    """
    delete a Virtual machine from vCenter
    :param host:
    :param username:
    :param pwd:
    :param port:
    :param vmname:
    :return: -1 : Exception, 0: the machine is not exist, 1: success,2 :fail
    """
    try:
        si = initializesi(vcip, username, pwd, port)
        serch_index = si.content.searchIndex
        vm = serch_index.FindByUuid(None, uuid, True, False)
        if vm is None:
            logger.info("The uuid is not exist")
            return 0
        if(vm.runtime.powerState == "poweredOn"):
            task = vm.PowerOffVM_Task()
            wait_for_task(task)
        deletetask = vm.Destroy_Task()
        if wait_for_task(deletetask):
            return True
        else:
            return 2
    except Exception as e:
        logger.error("Exception happens")
        logger.error(e)
        return -1


def check_vm_status(vcip, username, pwd, port, uuid):
    """
      Check weather vm is active
    :param vcip:
    :param username:
    :param pwd:
    :param port:
    :param uuid:
    :return:
    """
    try:
        si = initializesi(vcip, username, pwd, port)
        serch_index = si.content.searchIndex
        vm = serch_index.FindByUuid(None, uuid, True, False)
        if vm is None:
            logger.error("The uuid is not exist")
            # in module level need clean the db collection
            return False
        if (vm.runtime.powerState == "poweredOn"):
            logger.info("vm is ready")
            return True
        else:
            logger.error("The vm is not power on.")
            return False
    except Exception as e:
        logger.error("Exception")
        logger.error(e)
        return False


def db_update_one(filter, operations, after=True):
        """
        Update the data into the active db
        :param filter: Which instance to update, e.g., {"id": "xxx"}
        :param operations: data to update to db, e.g., {"$set": {}}
        :param after: return AFTER or BEFORE
        :return: The updated host json dict
        """
        if after:
            return_type = ReturnDocument.AFTER
        else:
            return_type = ReturnDocument.BEFORE
        col.find_one_and_update(
            filter, operations, return_document=return_type)
