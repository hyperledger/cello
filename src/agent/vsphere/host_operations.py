# Copyright 2017 (c) VMware, Inc. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import sys
import os
import logging
import threading
import time
import docker
import datetime
import socket
import ssl
from pyVmomi import vim
from pyVim.connect import SmartConnect, Disconnect
from pymongo.collection import ReturnDocument
import atexit

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from common import log_handler, LOG_LEVEL, db, utils
from agent import setup_container_host
from modules.models import Host as HostModel

context = ssl.SSLContext(ssl.PROTOCOL_SSLv23)
context.verify_mode = ssl.CERT_NONE
# ignore failure of certificate verification.


logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


class VsphereOperation():
    """
    Object to operate vSphere
    """
    def __init__(self):
        self.col = db["host"]

    def pull_images(self, worker_api):
        """
        init docker daemon for pulling and taging fabric images.
        :param worker_api: docker daemon address.
        :return: True or False
        """
        client = docker.DockerClient(base_url=worker_api)
        try:
            self.pull_and_tag_fabric_images(client)
            self.pull_and_tag_fabric_base_images(client)
            self.pull_and_tag_blockchain_explorer_images(client)
            return True
        except Exception as e:
            logger.error('{}'.format(e))
            return False

    def pull_and_tag_fabric_images(self, docker_client):
        """
        pull normal fabric images, such as peer, orderer, etc.
        :param docker_client: DockerClient object
        :return:
        """
        for image in utils.FABRIC_IMAGES:
            self.pull_image(docker_client, image, utils.ARCH, utils.VERSION)
            self.tag_image(docker_client, image, utils.ARCH, utils.VERSION)

    def pull_and_tag_fabric_base_images(self, docker_client):
        """
        pull base fabric images, such as ccenv, baseos, etc.
        :param docker_client: DockerClient object
        :return:
        """
        for image in utils.FABRIC_BASE_IMAGES:
            self.pull_image(docker_client, image, utils.ARCH,
                            utils.BASEIMAGE_RELEASE)
            self.tag_image(docker_client, image, utils.ARCH,
                           utils.BASEIMAGE_RELEASE)

    def pull_and_tag_blockchain_explorer_images(self, docker_client):
        """
        pull base fabric explorer images, blockchain-explorer, mysql5.7.
        :param docker_client: DockerClient object
        :return:
        """
        try:
            image = utils.BLOCKCHAIN_EXPLORER_IMAGE
            tag = utils.BLOCKCHAIN_EXPLORER_TAG
            logger.info("pulling image: {}".format(image))
            docker_client.images.pull(image, tag)
            image = utils.MYSQL_IMAGE
            tag = utils.MYSQL_TAG
            logger.info("pulling image: {}".format(image))
            docker_client.images.pull(image, tag)
        except Exception as e:
            logger.error("Docker client error msg: {}".format(e))
            error_msg = "Cannot pull image:{}".format("explorer images")
            raise Exception(error_msg)

    def pull_image(self, client, image, arch, version):
        """
        pull specific fabric images
        :param client: DockerClient object
        :param image: fabric image name
        :param arch: fabric image arch
        :param version: fabric image version
        """
        try:
            image_to_be_pull = utils.FABRIC_IMAGE.format(image)
            name = utils.FABRIC_IMAGE_FULL.format(image, arch, version)
            logger.info("pulling image: {}".format(name))
            client.images.pull(image_to_be_pull, tag=arch + '-' + version)
        except Exception as e:
            logger.error("Docker client error msg: {}".format(e))
            error_msg = "Cannot pull image:{}".format(name)
            raise Exception(error_msg)

    def tag_image(self, client, image, arch, version):
        """
        get specific fabric images and tag it to latest
        :param client: DockerClient object
        :param image: fabric image name
        :param arch: fabric image arch
        :param version: fabric image version
        """
        try:
            name = utils.FABRIC_IMAGE_FULL.format(image, arch, version)
            tag = utils.FABRIC_IMAGE_TAG.format(image, version)
            image_to_be_tag = client.images.get(name)
            logger.info("tag {} => {}".format(name, tag))
            image_to_be_tag.tag(tag)
        except Exception as e:
            logger.error("Docker client error msg: {}".format(e))
            error_msg = "Cannot tag image:{}".format(name)
            raise Exception(error_msg)

    def check_connection(self, vcip, username, pwd, port):
        """
        Check whether the connections args is useful.
        :param vcip: vc ip
        :param username: vc username
        :param pwd: vc password
        :param port: vc port default 443
        :return:
        """
        try:
            self.initializesi(vcip, username, pwd, port)
            return True
        except Exception as e:
            logger.error(e)
            return False

    def check_vc_resource(self, connection, resource_type, resource):
        """
        Check resource by type and name and return the resource object.
        :param connection: Connection return by initializesi
        :param resource_type: vim resource type
        :param resources: Resource
        :return:
        """
        res = self.check_object(connection, resource_type, resource)
        return res

    def check_object(self, connection, vimtype, name):
        """
        Check the existence of the object.
        :param connection:
        :param vimtype:   object type
        :param name:  object name
        :return:
        """
        obj = None
        container = connection.viewManager.CreateContainerView(
            connection.rootFolder, vimtype, True)
        for c in container.view:
            if name:
                if c.name == name:
                    obj = c
                    break
        return obj

    def initializesi(self, vcip, username, pwd, port):
        """
        initial the connection of the vCenter.
        :param vcip:
        :param username:
        :param pwd:
        :param port:
        :return:
        """
        if port is None:
            port = utils.VC_DEFAULT_PORT

        si = SmartConnect(host=vcip, user=username,
                          pwd=pwd, port=port, sslContext=context)
        atexit.register(Disconnect, si)
        return si

    def create_vm(self, connection, params, hid):
        """
        start a thread to create vm and will update db.
        :param connection: vc connection return by initializesi
        :param params:
        :return:
        """
        t = threading.Thread(target=self.setup_vm,
                             args=(connection, params, hid),
                             name="setupvm")
        t.start()

    def setup_vm(self, connection, params, hid):
        """
        setup  a new vritualmachine.
        :param connection: vc connection return by initializesi
        :param params:
        :return:
        """
        # vmname comes from upstream layer.

        vm = params.get(utils.VIRTUAL_MACHINE)
        vc = params.get(utils.VCENTER)

        # Get vm params
        vmname = vm.get(utils.VMNAME)
        vmmem = vm.get(utils.VMMEMORY)
        vmcpunum = vm.get(utils.VMCPU)
        vmip = vm.get(utils.VMIP)
        vmnetmask = vm.get(utils.VMNETMASK)
        vmdns = vm.get(utils.VMDNS)
        vmgateway = vm.get(utils.VMGATEWAY)

        # Get vc params
        vcip = vc.get(utils.VCIP)
        vcusername = vc.get(utils.VCUSERNAME)
        vcpwd = vc.get(utils.VCPWD)
        vcport = vc.get(utils.VCPORT)
        template = vc.get(utils.TEMPLATE)
        datacenter = vc.get(utils.VC_DATACENTER)
        cluster = vc.get(utils.VC_CLUSTER)
        datastore = vc.get(utils.VC_DATASTORE)
        network = vc.get(utils.NETWORK)
        destfolder = datacenter.vmFolder

        vmconf = vim.vm.ConfigSpec(numCPUs=vmcpunum,
                                   memoryMB=vmmem * 1024)
        # nic
        nic = vim.vm.device.VirtualDeviceSpec()
        nic.operation = vim.vm.device.VirtualDeviceSpec.Operation.edit
        nic.device = vim.vm.device.VirtualVmxnet3()
        nic.device.wakeOnLanEnabled = True
        nic.device.addressType = utils.NIC_DEVICE_ADDRESS_TYPE
        nic.device.key = 4000
        nic.device.deviceInfo = vim.Description()
        nic.device.backing = vim.vm.device. \
            VirtualEthernetCard.NetworkBackingInfo()
        nic.device.backing.network = network
        nic.device.backing.useAutoDetect = False
        nic.device.connectable = vim.vm.device.VirtualDevice.ConnectInfo()
        nic.device.connectable.startConnected = True
        nic.device.connectable.allowGuestControl = True
        # guest_map
        guest_map = vim.vm.customization.AdapterMapping()
        guest_map.adapter = vim.vm.customization.IPSettings()
        guest_map.adapter.ip = vim.vm.customization.FixedIp()
        guest_map.adapter.ip.ipAddress = vmip
        guest_map.adapter.subnetMask = vmnetmask
        guest_map.adapter.gateway = vmgateway
        globalip = vim.vm.customization.GlobalIPSettings(
            dnsServerList=vmdns)
        name = vim.vm.customization.FixedName(name=utils.VM_DEFAULT_HOSTNAME)
        ident = vim.vm.customization.LinuxPrep(hostName=name)
        customspec = vim.vm.customization. \
            Specification(nicSettingMap=[guest_map],
                          globalIPSettings=globalip,
                          identity=ident)

        # relocateSpec
        relocatespec = vim.vm.RelocateSpec()
        relocatespec.datastore = datastore
        relocatespec.pool = cluster.resourcePool

        clonespec = vim.vm.CloneSpec()
        clonespec.location = relocatespec
        clonespec.customization = customspec
        clonespec.config = vmconf
        clonespec.powerOn = True

        try:
            host = HostModel.objects.get(id=hid)
        except Exception:
            logger.error("No vsphere host found with id=" + hid)
            return

        host.vcparam = {
            utils.VMUUID: '',
            utils.VMIP: vmip,
            utils.VMNETMASK: vmnetmask,
            utils.VMDNS: vmdns,
            utils.VMGATEWAY: vmgateway,
            utils.VMCPU: vmcpunum,
            utils.VMMEMORY: vmmem,
            utils.VC_CLUSTER: cluster.name,
            utils.VC_DATASTORE: datastore.name,
            utils.VC_DATACENTER: datacenter.name,
            utils.VCIP: vcip,
            utils.VCUSERNAME: vcusername,
            utils.VCPWD: vcpwd,
            utils.VCPORT: vcport
        }
        try:
            task = template.Clone(folder=destfolder, name=vmname,
                                  spec=clonespec)
            # Block here for vm creation.
            self.wait_for_task(task)
            vm = self.check_object(connection, [vim.VirtualMachine], vmname)
            workerapi = "tcp://" + vmip + ":2375"
            host.worker_api = workerapi
            uuid = vm.summary.config.uuid
            host.vcparam[utils.VMUUID] = uuid
            host.save()
            if self.check_isport_open(vmip, utils.WORKER_API_PORT,
                                      utils.DEFAULT_TIMEOUT):
                if (self.pull_images(workerapi) and
                    setup_container_host(utils.WORKER_TYPE_DOCKER,
                                         workerapi)):
                    host.status = 'active'
                    logger.info(host)
                else:
                    host.status = 'error'
                    logger.error("Failed to setup container host")
            else:
                host.status = 'error'
                logger.error("Failed to ping docker daemon:{}:{}"
                             .format(vmip, "2375"))
            host.save()
            # Should be safe to delete vm though VsphereHost layer.
        except Exception as e:
            logger.error(e)
            if self.check_isport_open(vmip, utils.WORKER_API_PORT,
                                      utils.DEFAULT_TIMEOUT):
                host = HostModel.objects.get(id=hid)
                uuid = host.vcparam[utils.VMUUID]
                self.delete_vm(vcip, vcusername, vcpwd, vcport, uuid)
            host.delete()
            return

    def wait_for_task(self, task):
        """
        Wait for a vCenter task to finish
        :param task:
        :return:
        """

        # loop to check vm creation state.
        while True:
            if task.info.state == 'success':
                break

            if task.info.state == 'error':
                raise Exception("fault code:" + str(task.info.error))

            time.sleep(5)

    def delete_vm(self, vcip, username, pwd, port, uuid):
        """
        Delete a Virtual machine from vCenter.
        :param vcip:
        :param username:
        :param pwd:
        :param port:
        :param uuid:
        :return:
        """
        try:
            si = self.initializesi(vcip, username, pwd, port)
            serch_index = si.content.searchIndex
            vm = serch_index.FindByUuid(None, uuid, True, False)
            if vm is None:
                logger.info("The uuid -{} is not exist".format(uuid))
                # in module level need clean the db self.collection
                return True

            # Start power off  vm
            if (vm.runtime.powerState == "poweredOn"):
                task = vm.PowerOffVM_Task()
                self.wait_for_task(task)

            # Start delete vm
            deletetask = vm.Destroy_Task()
            self.wait_for_task(deletetask)

            # No Exception was raised, pass the deletion.
            return True

        except Exception as e:
            logger.error(e)
            return False

    def check_vmstatus(self, vcip, username, pwd, port, uuid):
        """
          Check whether vm is active.
        :param vcip:
        :param username:
        :param pwd:
        :param port:
        :param uuid:
        :return:
        """
        try:
            si = self.initializesi(vcip, username, pwd, port)
            serch_index = si.connection.searchIndex
            vm = serch_index.FindByUuid(None, uuid, True, False)
            if vm is None:
                logger.error("The uuid is not exist")
                # in module level need clean the db self.collection
                return False
            if (vm.runtime.powerState == "poweredOn"):
                logger.info("vm is ready")
                return True
            else:
                logger.error("The vm is not power on.")
                return False
        except Exception as e:
            logger.error(e)
            return False

    def check_isport_open(self, vmip, vmport, timeout=300):
        """
        Check whether the vmport is ready.
        :param vmip:
        :param vmport:
        :param timeout: unit second
        :return:
        """
        sk = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        while timeout > 0:
            try:
                time.sleep(5)
                timeout -= 5
                sk.connect((vmip, vmport))
                return True
            except Exception:
                pass
        return False
