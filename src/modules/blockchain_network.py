from threading import Thread
import time
import socket
import shutil
import requests

from agent.docker.blockchain_network import NetworkOnDocker
from agent.k8s.blockchain_network import NetworkOnKubenetes
from modules.models import modelv2
from modules.organization import organizationHandler as org_handler
import datetime
from common import fabric_network_define as file_define
from common import CLUSTER_PORT_START, CLUSTER_PORT_STEP, WORKER_TYPE_K8S
import json

import logging
import os
from subprocess import call
from common import log_handler, LOG_LEVEL
from modules import host_handler

logger = logging.getLogger(__name__)


logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

PEER_NODE_HOSTPORT_NUM = 2
ORDERER_NODE_HOSTPORT_NUM = 1
CA_NODE_HOSTPORT_NUM = 1
COUCHDB_NODE_HOSTPORT_NUM = 1
PEER_NODE_HOSTPORT_NUM_WITH_CCLISTEN = 3

agent_cls = {
    'docker': NetworkOnDocker,
    'kubenetes': NetworkOnKubenetes
}

fabric_image_version = {
    'v1.1': '1.1.0',
    'v1.4': '1.4.2'
}
# CELLO_MASTER_FABRIC_DIR is mounted by nfs container as '/'
CELLO_MASTER_FABRIC_DIR = '/opt/fabric/'
CELLO_SECRET_FOR_TOKEN_DIR = '/opt/secret/'


def health_check():
    #print("test block chain healthy !!")
    #logger.info("block chain healthy ")
    networks = modelv2.BlockchainNetwork.objects().all()
    if not networks:
        print("no blockchain !!")
        time.sleep(10)
        return
    for network in networks:
        service_endpoints = modelv2.ServiceEndpoint.objects(network=network)
        if not service_endpoints:
            network.update(set__healthy=False)
            print("no endpoints !!")
            continue
        end_healthy = True
        healthy = False

        time.sleep(5)
        for ep in service_endpoints:
            # event port is not needed in fabric 1.4
            # don't do health check on event port to avoid health check fail on fabric 1.3 later
            if ep.service_type == 'peer' and ep.peer_port_proto == 'cc_listen':
                ep.update(set__healthy=True)
                continue

            ip = ep.service_ip
            port = ep.service_port
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            try:
                sock.connect((ip, port))
                #logger.info("connect {}:{} succeed".format(ip, port))
                healthy = True
                end_healthy = healthy and end_healthy
                ep.update(set__healthy=True)
            except Exception as e:
                logger.error("connect {}:{} fail, reason {}".format(ip, port, e))
                healthy = False
                ep.update(set__healthy=False)
                # break
            finally:
                sock.close()

        if not healthy:
            network.update(set__healthy=False)
            return
        else:
            network.update(set__healthy=True)
            return

class BlockchainNetworkHandler(object):
    """ Main handler to operate the cluster in pool

    """
    def __init__(self):
        self.host_agents = {
            'docker': NetworkOnDocker(),
            'kubernetes': NetworkOnKubenetes()
        }


    def _schema(self, doc, many=False):
        network_schema = modelv2.BlockchainNetworkSchema(many=many)
        return network_schema.dump(doc).data

    def schema(self, doc, many=False):
        return self._schema(doc, many)

    def endports_schema(self, doc, many=False):
        endports_schema = modelv2.ServiceEndpointSchema(many=many)
        return endports_schema.dump(doc).data

    # TODO: MODIFY THIS METHOD
    def find_free_start_ports(self, number, host):
        """ Find the first available port for a new cluster api

        This is NOT lock-free. Should keep simple, fast and safe!

        Check existing cluster records in the host, find available one.

        :param host_id: id of the host
        :param number: Number of ports to get
        :return: The port list, e.g., [7050, 7150, ...]
        """
        logger.debug("Find {} start ports ".format(number))


        networks_exists = modelv2.BlockchainNetwork.objects(host=host)
        ports_existed = [service.service_port for service in
                         modelv2.ServiceEndpoint.objects(network__in=networks_exists)]

        logger.debug("The ports existed: {}".format(ports_existed))
        # available host port range is 1~65535, this function adpots
        # start port is 7050, port step is 1, so available port number
        # is (65535-30000)/1=35535, considering the network scale,
        # setting the most available host port is 30000
        if len(ports_existed) + number >= 30000:
            logger.warning("Too much ports are already in used.")
            return []
        candidates = [CLUSTER_PORT_START + i * CLUSTER_PORT_STEP
                      for i in range(len(ports_existed) + number)]

        result = list(filter(lambda x: x not in ports_existed, candidates))

        logger.debug("Free ports are {}".format(result[:number]))
        return result[:number]

    def delete(self, network):
        """ Delete a cluster instance

        Clean containers, remove db entry. Only operate on active host.

        :param id: id of the cluster to delete
        :param forced: Whether to removing user-using cluster, for release
        :return:
        """
        logger.debug("Delete cluster: id={}".format(network.id))
        network.update(set__status='deleting')
        net_id = network.id
        try:
            #self.host_agents[host.type].delete(network)
            # remove cluster info from host
            logger.info("remove network from host, network:{}".format(network.id))

            # if org has referenced network, remove
            for org_id in network.peer_orgs:
                peer_org = org_handler().schema(org_handler().get_by_id(org_id))
                host_id = peer_org['host_id']
                host_handler.refresh_status(host_id)
                host = host_handler.get_active_host_by_id(host_id)
                host.update(pull__clusters=network.id)
                self.host_agents[host.type].delete_peer_org(peer_org, host, net_id)
                org_obj = modelv2.Organization.objects.get(id=org_id)
                org_obj.update(unset__network=network.id)

            for org_id in network.orderer_orgs:
                orderer_org = org_handler().schema(org_handler().get_by_id(org_id))
                host_id = orderer_org['host_id']
                host_handler.refresh_status(host_id)
                host = host_handler.get_active_host_by_id(host_id)
                consensus_type = network.consensus_type
                host.update(pull__clusters=network.id)
                self.host_agents[host.type].delete_orderer_org(orderer_org, consensus_type, host, net_id)
                org_obj = modelv2.Organization.objects.get(id=org_id)
                org_obj.update(unset__network=network.id)

            #从Userdashboard的mongo中删除该network相关的数据
            self.userdashboard_mongo_delete(network.id)

            network.delete()
            filepath = '{}{}'.format(CELLO_MASTER_FABRIC_DIR, network.id)
            os.system('rm -rf {}'.format(filepath))


            return
        except Exception as e:
            logger.info("remove network {} fail from host".format(network.id))
            network.update(set__status = 'error')
            raise e



    def get_by_id(self, id):
        """ Get a host

        :param id: id of the doc
        :return: serialized result or obj
        """
        try:
            ins = modelv2.BlockchainNetwork.objects.get(id=id)
        except Exception:
            logger.warning("No network found with id=" + id)
            return None

        return ins

    def get_endpoints_list(self, filter_data={}):
        """ List orgs with given criteria

        :param filter_data: Image with the filter properties
        :return: iteration of serialized doc
        """
        logger.info("filter data {}".format(filter_data))

        network = modelv2.BlockchainNetwork.objects.get(id=filter_data)
        serviceEndpoints = modelv2.ServiceEndpoint.objects(network=network)
        return self.endports_schema(serviceEndpoints, many=True)

    def refresh_health(self, network):

        service_endpoints = modelv2.ServiceEndpoint.objects(network=network)
        if not service_endpoints:
            network.update(set__healthy=False)
        end_healthy = True
        healthy = False
        for ep in service_endpoints:
            # event port is not needed in fabric 1.4
            # don't do health check on event port to avoid health check fail on fabric 1.3 later
            if ep.service_type == 'peer' and ep.peer_port_proto == 'event':
                continue

            ip = ep.service_ip
            port = ep.service_port
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            try:
                sock.connect((ip, port))
                logger.info("connect {}:{} succeed".format(ip, port))
                healthy = True
                end_healthy = healthy and end_healthy
            except Exception as e:
                logger.error("connect {}:{} fail, reason {}".format(ip, port, e))
                healthy = False
                # break
            finally:
                sock.close()

        if not healthy:
            network.update(set__healthy=False)
            return
        else:
            network.update(set__healthy=True)
            return

    def _create_network(self, network_config, request_host_ports):
        net_id = network_config['id']
        network = modelv2.BlockchainNetwork.objects.get(id=net_id)

        try:
            #self.host_agents[host.type].create(network_config, request_host_ports)
            # # service urls can only be calculated after service is create
            # if host.type == WORKER_TYPE_K8S:
            #     service_urls = self.host_agents[host.type] \
            #         .get_services_urls(net_id)
            # else:
            #     service_urls = self.gen_service_urls(net_id)
            net_id = network_config['id']
            net_name = network_config['name']
            couchdb_enabled = False
            if network_config['db_type'] == 'couchdb':
                couchdb_enabled = True
            fabric_version = fabric_image_version[network_config['fabric_version']]
            consensus_type = network_config['consensus_type']
            portid = []
            portid.append(0)

            for orderer_org in network_config['orderer_org_dicts']:
                host_id = orderer_org['host_id']
                host_handler.refresh_status(host_id)
                host = host_handler.get_active_host_by_id(host_id)
                host.update(add_to_set__clusters=[net_id])
                self.host_agents[host.type].create_orderer_org(orderer_org, consensus_type, host, net_id, net_name,
                                                               fabric_version,  request_host_ports, portid)
            time.sleep(5)

            for peer_org in network_config['peer_org_dicts']:
                host_id = peer_org['host_id']
                peer_num = peer_org['peerNum']
                host_handler.refresh_status(host_id)
                host = host_handler.get_active_host_by_id(host_id)
                host.update(add_to_set__clusters=[net_id])
                self.host_agents[host.type].create_peer_org(peer_org, couchdb_enabled, host, net_id, net_name,
                                                            fabric_version, request_host_ports, portid, peer_num)

            network.update(set__status='running')
            # zsh修改，为解决网络创建过程中，还可以继续操作组织的问题，将给组织增加网络的动作放到前面
            # for peer_org in network_config['peer_org_dicts']:
            #     org_obj = modelv2.Organization.objects.get(id=peer_org['id'])
            #     org_obj.update(set__network=network)
            # for orderer_org in network_config['orderer_org_dicts']:
            #     org_obj = modelv2.Organization.objects.get(id=orderer_org['id'])
            #     org_obj.update(set__network=network)
            logger.info("Create network OK, id={}".format(net_id))

            def check_health_work(network):
                time.sleep(180)
                self.refresh_health(network)

            t = Thread(target=check_health_work, args=(network,))
            t.start()
        except Exception as e:
            logger.error("network {} create failed for {}".format(net_id, e))
            # will not call self.delete(network) in case of nested exception
            self.delete(network)
            raise e

    def _update_network(self, network_config, request_host_ports):
        net_id = network_config['id']
        network = modelv2.BlockchainNetwork.objects.get(id=net_id)

        try:
            #self.host_agents[host.type].update(network_config, request_host_ports)
            # # service urls can only be calculated after service is create
            # if host.type == WORKER_TYPE_K8S:
            #     service_urls = self.host_agents[host.type] \
            #         .get_services_urls(net_id)
            # else:
            #     service_urls = self.gen_service_urls(net_id)
            net_id = network_config['id']
            net_name = network_config['name']
            couchdb_enabled = False
            if network_config['db_type'] == 'couchdb':
                couchdb_enabled = True
            fabric_version = fabric_image_version[network_config['fabric_version']]
            portid = []
            portid.append(0)

            for peer_org in network_config['peer_org_dicts']:
                host_id = peer_org['host_id']
                peer_num = peer_org['peerNum']
                host = host_handler.get_active_host_by_id(host_id)
                host.update(add_to_set__clusters=[net_id])
                self.host_agents[host.type].create_peer_org(peer_org, couchdb_enabled, host, net_id, net_name,
                                                            fabric_version, request_host_ports, portid, peer_num)


            network.update(set__status='running')
            for peer_org in network_config['peer_org_dicts']:
                org_obj = modelv2.Organization.objects.get(id=peer_org['id'])
                org_obj.update(set__network=network)
            for orderer_org in network_config['orderer_org_dicts']:
                org_obj = modelv2.Organization.objects.get(id=orderer_org['id'])
                org_obj.update(set__network=network)
            logger.info("Update network OK, id={}".format(net_id))

        except Exception as e:
            logger.error("network {} update failed for {}".format(net_id, e))
            # will not call self.delete(network) in case of nested exception
            #self.delete(network)
            raise e

    def _update_network_for_addpeers(self, network_config, request_host_ports):
        net_id = network_config['id']
        network = modelv2.BlockchainNetwork.objects.get(id=net_id)

        try:
            #self.host_agents[host.type].update(network_config, request_host_ports)
            # # service urls can only be calculated after service is create
            # if host.type == WORKER_TYPE_K8S:
            #     service_urls = self.host_agents[host.type] \
            #         .get_services_urls(net_id)
            # else:
            #     service_urls = self.gen_service_urls(net_id)
            net_id = network_config['id']
            net_name = network_config['name']
            peer_num = network_config['peer_num']
            peer_org = network_config['peer_org_dict']
            couchdb_enabled = False
            if network_config['db_type'] == 'couchdb':
                couchdb_enabled = True
            fabric_version = fabric_image_version[network_config['fabric_version']]
            portid = []
            portid.append(0)

            host_id = peer_org['host_id']
            host = host_handler.get_active_host_by_id(host_id)
            host_handler.refresh_status(host_id)
            self.host_agents[host.type].create_peer_org(peer_org, couchdb_enabled, host, net_id, net_name,
                                                        fabric_version, request_host_ports, portid, peer_num)


            network.update(set__status='running')

            logger.info("Update network OK, id={}".format(net_id))

        except Exception as e:
            logger.error("network {} update failed for {}".format(net_id, e))
            # will not call self.delete(network) in case of nested exception
            #self.delete(network)
            raise e

    def create(self, id, name, description, fabric_version,
               orderer_orgs, peer_orgs, host, consensus_type, db_type, create_ts):

        peer_org_dicts = []
        orderer_org_dicts = []
        for org_id in peer_orgs:
            peer_org_dict = org_handler().schema(org_handler().get_by_id(org_id))
            # blocakchain_network_id非空，表明该组织已添加到其他nework中
            if peer_org_dict['blockchain_network_id']:
                error_msg = ': this org has been added by another network!'
                raise Exception(error_msg)
            peer_org_dicts.append(peer_org_dict)
        for org_id in orderer_orgs:
            orderer_org_dict = org_handler().schema(org_handler().get_by_id(org_id))
            if orderer_org_dict['blockchain_network_id']:
                error_msg = ': this org has been added by another network!'
                raise Exception(error_msg)
            orderer_org_dicts.append(orderer_org_dict)

        network = modelv2.BlockchainNetwork(id=id,
                                            name=name,
                                            description=description,
                                            fabric_version=fabric_version,
                                            orderer_orgs=orderer_orgs,
                                            peer_orgs=peer_orgs,
                                            host=host,
                                            consensus_type=consensus_type,
                                            db_type=db_type,
                                            create_ts=create_ts,
                                            status="creating")
        network.save()

        order_orgs_domain = []
        for each in orderer_org_dicts:
            if each['domain'] not in order_orgs_domain:
                order_orgs_domain.append(each['domain'])
            else:
                network.delete()
                error_msg = ': orderer\'s domain in one network can not be same!'
                raise Exception(error_msg)

        couchdb_enabled = False
        if db_type == 'couchdb':
            couchdb_enabled = True

        ### get fabric service ports
        peer_org_num = len(peer_org_dicts)
        peer_num = 0
        orderer_num = 0
        # zsh修改，原本在_create_network中，为组织增加network信息，前调到这里
        for org in peer_org_dicts:
            peer_num += org['peerNum']
            org_obj = modelv2.Organization.objects.get(id=org['id'])
            org_obj.update(set__network=network)
        for org in orderer_org_dicts:
            orderer_num += len(org['ordererHostnames'])
            org_obj = modelv2.Organization.objects.get(id=org['id'])
            org_obj.update(set__network=network)

        if couchdb_enabled is True:
            request_host_port_num = peer_org_num * CA_NODE_HOSTPORT_NUM + \
                                        peer_num * PEER_NODE_HOSTPORT_NUM + \
                                        peer_num * COUCHDB_NODE_HOSTPORT_NUM + \
                                        orderer_num * ORDERER_NODE_HOSTPORT_NUM
        else:
            request_host_port_num = peer_org_num * CA_NODE_HOSTPORT_NUM + \
                                        peer_num * PEER_NODE_HOSTPORT_NUM + \
                                        orderer_num * ORDERER_NODE_HOSTPORT_NUM

        request_host_ports = self.find_free_start_ports (request_host_port_num, host)
        if len(request_host_ports) != request_host_port_num:
            error_msg = "no enough ports for network service containers"
            logger.error(error_msg)
            raise Exception(error_msg)

        # create persistent volume path for peer and orderer node
        # TODO : code here

        logger.info(" before function file_define.commad_create_path,and path is")
        # create public.key or private.key
        isExist = file_define.creat_secret_key_files()
        if not isExist:
            logger.error(" after function file_define.creat_secret_key_files, and it is {} ".format(isExist))
        # create filepath with network_id at path FABRIC_DIR
        filepath = file_define.commad_create_path(id)
        print("filepath = {}".format(filepath))
        logger.info(" after function file_define.commad_create_path,and path is {}".format(filepath))
        # create crypto-config.yaml file at filepath

        file_define.dump_crypto_config_yaml_file(filepath, peer_org_dicts, orderer_org_dicts)

        # create configtx.yaml file
        file_define.dump_configtx_yaml_file(filepath, consensus_type, peer_org_dicts, orderer_org_dicts,
                                                fabric_version, request_host_ports)
        # create channel-artifacts path
        blockGenesis_filepath = '{}{}/channel-artifacts'.format(CELLO_MASTER_FABRIC_DIR, id)
        try:
            os.system('mkdir -p {}'.format(blockGenesis_filepath))
        except:
            error_msg = 'blockGenesis_filepath file create failed.'
            # raise FileOperaterFailed(error_msg)

        try:
            fabric_version_dir = fabric_version.replace('.', '_')
            # change work dir to '/opt'
            # origin_dir = os.getcwd()
            os.chdir(filepath)
            # print(os.getcwd())
            # create certificates
            call(["/opt/fabric_tools/{}/cryptogen".format(fabric_version_dir), "generate", "--config=./crypto-config.yaml"])

            # create genesis.block and channel configuration blocks
            call(["/opt/fabric_tools/{}/configtxgen".format(fabric_version_dir), "-profile", "TwoOrgsOrdererGenesis", "-outputBlock",
                  "./channel-artifacts/genesis.block"])
            # call(["/opt/configtxgen","-profile","TwoOrgsChannel","-outputCreateChannelTx","./channel-artifacts/channel.tx","-channelID","mychannel"])
            # call(["/opt/configtxgen","-profile","TwoOrgsChannel","-outputAnchorPeersUpdate","./channel-artifacts/Org1MSPanchors.tx",\
            #  "-channelID","mychannel","-asOrg","Org1MSP"])
            # call(["/opt/configtxgen","-profile","TwoOrgsChannel","-outputAnchorPeersUpdate","./channel-artifacts/Org2MSPanchors.tx",\
            #  "-channelID","mychannel","-asOrg","Org2MSP"])

            # change back

            # for k8s orderer node to use genesis.block
            shutil.copy('{}/genesis.block'.format(blockGenesis_filepath), '{}{}/crypto-config/ordererOrganizations/'.
                        format(CELLO_MASTER_FABRIC_DIR, id))
            # os.chdir(origin_dir)
        except Exception as e:
            error_msg = 'create certificate or genesis block failed!'
            self.remove_network(network)
            raise Exception(error_msg)

        try:
            # create fabric-ca-server-config.yaml file
            file_define.fabric_ca_config_files(id, fabric_version, CELLO_MASTER_FABRIC_DIR, peer_org_dicts)
        except:
            error_msg = 'create fabric_ca_config_files failed!.'
            self.remove_network(network)
            raise Exception(error_msg)


        # use network model to get?
        # no. network models only have org ids, no details needed
        network_config = {'id':id, 'name': name, 'fabric_version': fabric_version,
                          'orderer_org_dicts': orderer_org_dicts, 'peer_org_dicts': peer_org_dicts,
                          'consensus_type': consensus_type, 'db_type': db_type, 'host':host}

        t = Thread(target=self._create_network, args=(network_config, request_host_ports))
        t.start()

        return self._schema(network)

    def addorgtonetwork(self, id, peer_orgs, orderer_orgs):
        ins = modelv2.BlockchainNetwork.objects.get(id=id)
        host = ins.host
        consensus_type = ins.consensus_type
        fabric_version = ins.fabric_version
        name = ins.name
        peer_org_dicts = []
        orderer_org_dicts = []
        peer_orgs_temp = ins.peer_orgs
        orderer_orgs_temp = ins.orderer_orgs
        if peer_orgs != None:
            for org_id in peer_orgs:
                peer_org_dict = org_handler().schema(org_handler().get_by_id(org_id))
                peer_org_dicts.append(peer_org_dict)
                peer_orgs_temp.append(org_id)
        if orderer_orgs != None:
            org_id = orderer_orgs
            orderer_org_dict = org_handler().schema(org_handler().get_by_id(org_id))
            orderer_org_dicts.append(orderer_org_dict)
            orderer_orgs_temp.append(org_id)

        db_type = ins.db_type
        couchdb_enabled = False
        if db_type == 'couchdb':
            couchdb_enabled = True
        ### get fabric service ports
        peer_org_num = len(peer_org_dicts)
        peer_num = 0
        orderer_num = 0
        for org in peer_org_dicts:
            peer_num += org['peerNum']
        for org in orderer_org_dicts:
            orderer_num += len(org['ordererHostnames'])

        if couchdb_enabled is True:
            request_host_port_num = peer_org_num * CA_NODE_HOSTPORT_NUM + \
                                        peer_num * PEER_NODE_HOSTPORT_NUM + \
                                        peer_num * COUCHDB_NODE_HOSTPORT_NUM + \
                                        orderer_num * ORDERER_NODE_HOSTPORT_NUM
        else:
            request_host_port_num = peer_org_num * CA_NODE_HOSTPORT_NUM + \
                                        peer_num * PEER_NODE_HOSTPORT_NUM + \
                                        orderer_num * ORDERER_NODE_HOSTPORT_NUM

        request_host_ports = self.find_free_start_ports(request_host_port_num, host)

        if len(request_host_ports) != request_host_port_num:
            error_msg = "no enough ports for network service containers"
            logger.error(error_msg)
            raise Exception(error_msg)

        #logger.info(" before function file_define.commad_create_path,and path is")
        # create filepath with network_id at path FABRIC_DIR
        filepath = file_define.commad_create_path(id)
        print("filepath = {}".format(filepath))
        #logger.info(" after function file_define.commad_create_path,and path is {}".format(filepath))
        # create crypto-config.yaml file at filepath

        file_define.update_crypto_config_yaml_file(filepath, peer_org_dicts, orderer_org_dicts)

        # create configtx.yaml file
        file_define.update_dump_configtx_yaml_file(filepath, peer_org_dicts, orderer_org_dicts, request_host_ports)

        try:
            # change work dir to '/opt'
            origin_dir = os.getcwd()
            os.chdir(filepath)
            print(os.getcwd())
            # create certificates
            call("/opt/fabric_tools/v1_4/cryptogen extend --config=%s/crypto-config.yaml" % filepath, shell=True)

            os.chdir(origin_dir)
            #os.system('rm -r {}'.format(fileorgpath))
        except:
            error_msg = 'create certificate or genesis block failed!'
            raise Exception(error_msg)

        self.createyamlforneworgs(id, peer_orgs,orderer_orgs)

        self.sys_channelInfo_update(id, peer_org_dicts)

        ins.update(set__peer_orgs=peer_orgs_temp)

        self.sys_channelOrderer_update(id, orderer_org_dicts, request_host_ports)

        ins.update(set__orderer_orgs=orderer_orgs_temp)

        try:
            # create fabric-ca-server-config.yaml file
            file_define.fabric_ca_config_files(id, fabric_version, CELLO_MASTER_FABRIC_DIR, peer_org_dicts)
        except:
            error_msg = 'create fabric_ca_config_files failed!.'
            raise Exception(error_msg)

        # use network model to get?
        # network models only have org ids, no details needed
        network_config = {'id':id, 'name': name, 'fabric_version': fabric_version,
                         'orderer_org_dicts': orderer_org_dicts, 'peer_org_dicts': peer_org_dicts,
                         'consensus_type': consensus_type, 'db_type': db_type, 'host':host}

        t = Thread(target=self._update_network, args=(network_config, request_host_ports))
        t.start()

        return self._schema(ins)

    def addpeertonetwork(self, id, peer_org, peers_num):
        ins = modelv2.BlockchainNetwork.objects.get(id=id)
        host = ins.host
        fabric_version = ins.fabric_version
        name = ins.name

        peer_org_dict = org_handler().schema(org_handler().get_by_id(peer_org))

        db_type = ins.db_type
        couchdb_enabled = False
        if db_type == 'couchdb':
            couchdb_enabled = True
        ### get fabric service ports
        peer_num = peers_num
        peer_org_dict['peerNum'] += peers_num
        
        if couchdb_enabled is True:
            request_host_port_num = peer_num * PEER_NODE_HOSTPORT_NUM + \
                                    peer_num * COUCHDB_NODE_HOSTPORT_NUM
        else:
            request_host_port_num = peer_num * PEER_NODE_HOSTPORT_NUM

        request_host_ports = self.find_free_start_ports(request_host_port_num, host)

        if len(request_host_ports) != request_host_port_num:
            error_msg = "no enough ports for network service containers"
            logger.error(error_msg)
            raise Exception(error_msg)

        # logger.info(" before function file_define.commad_create_path,and path is")
        # create filepath with network_id at path FABRIC_DIR
        filepath = file_define.commad_create_path(id)
        print("filepath = {}".format(filepath))
        # logger.info(" after function file_define.commad_create_path,and path is {}".format(filepath))
        # create crypto-config.yaml file at filepath

        file_define.update_crypto_file_for_addpeers(filepath, peer_org_dict, peers_num)

        try:
            # change work dir to '/opt'
            origin_dir = os.getcwd()
            os.chdir(filepath)
            print(os.getcwd())
            # create certificates
            call("/opt/fabric_tools/v1_4/cryptogen extend --config=%s/crypto-config.yaml" % filepath, shell=True)

            os.chdir(origin_dir)
            # os.system('rm -r {}'.format(fileorgpath))
        except:
            error_msg = 'create certificate or genesis block failed!'
            raise Exception(error_msg)
        try:
            sk_file = ''
            org_name = peer_org_dict['name']
            org_domain = peer_org_dict['domain']
            org_fullDomain_name = '.'.join([org_name, org_domain])
            ca_dir = '/opt/fabric/{net_dir}/crypto-config/peerOrganizations/{org_fullDomain_name}/ca/'. \
                format(net_dir=id, org_fullDomain_name=org_fullDomain_name)
            for f in os.listdir(ca_dir):  # find out sk!
                if f.endswith("_sk"):
                    sk_file = f
            peer_org_dict['sk_file'] = sk_file
        except:
            error_msg = 'create_userdashboard failed!.'
            raise Exception(error_msg)

        # use network model to get?
        # network models only have org ids, no details needed
        network_config = {'id': id, 'name': name, 'fabric_version': fabric_version,
                          'peer_org_dict': peer_org_dict, 'peer_num':peers_num,
                          'db_type': db_type}

        t = Thread(target=self._update_network_for_addpeers, args=(network_config, request_host_ports))
        t.start()

        return self._schema(ins)

    def createyamlforneworgs(self, id, peer_orgs,orderer_orgs):
        ins = modelv2.BlockchainNetwork.objects.get(id=id)

        filepath = file_define.commad_create_path(id)
        print("filepath = {}".format(filepath))

        for org_id in peer_orgs:
            peer_org_dict = org_handler().schema(org_handler().get_by_id(org_id))

            fileorgpath = '{}/{}'.format(filepath,org_id)
            os.system('mkdir -p {}/crypto-config/peerOrganizations/'.format(fileorgpath))

            try:
                # change work dir to '/opt'
                origin_dir = os.getcwd()
                os.chdir(fileorgpath)
                print(os.getcwd())

                os.system("export FABRIC_CFG_PATH=$PWD")
                mspid = '{}MSP'.format(peer_org_dict['name'][0:1].upper()+peer_org_dict['name'][1:])
                orgname = peer_org_dict['name']
                org_domain = peer_org_dict['domain']
                orgdir = '{}.{}'.format(orgname,org_domain)
                #call("/opt/fabric_tools/v1_1/cryptogen generate --config=%s/crypto-config.yaml" % fileorgpath, shell=True)
                os.system('cp -r {}/crypto-config/peerOrganizations/{} {}/crypto-config/peerOrganizations/'.format(filepath, orgdir, fileorgpath))
                os.system('cp -r {}/configtx.yaml {}/'.format(filepath,fileorgpath))
                call("/opt/fabric_tools/v1_4/configtxgen -printOrg %s > ../channel-artifacts/%s.json" % (mspid, orgname), shell=True)

                os.chdir(origin_dir)
                os.system('rm -r {}'.format(fileorgpath))
            except:
                error_msg = 'create certificate or genesis block failed!'
                raise Exception(error_msg)
        if orderer_orgs != None:
            org_id = orderer_orgs[0]

            orderer_org_dict = org_handler().schema(org_handler().get_by_id(org_id))

            fileorgpath = '{}/{}'.format(filepath,org_id)
            os.system('mkdir -p {}/crypto-config/ordererOrganizations/'.format(fileorgpath))

            try:
                # change work dir to '/opt'
                origin_dir = os.getcwd()
                os.chdir(fileorgpath)
                print(os.getcwd())

                os.system("export FABRIC_CFG_PATH=$PWD")
                mspid = '{}Org'.format(orderer_org_dict['name'][0:1].upper()+orderer_org_dict['name'][1:])
                orgname = orderer_org_dict['name']
                org_domain = orderer_org_dict['domain']
                orgdir = '{}'.format(org_domain)
                #call("/opt/fabric_tools/v1_1/cryptogen generate --config=%s/crypto-config.yaml" % fileorgpath, shell=True)
                os.system('cp -r {}/crypto-config/ordererOrganizations/{} {}/crypto-config/ordererOrganizations/'.format(filepath, orgdir, fileorgpath))
                os.system('cp -r {}/configtx.yaml {}/'.format(filepath,fileorgpath))
                call("/opt/fabric_tools/v1_4/configtxgen -printOrg %s > ../channel-artifacts/%s.json" % (mspid, orgname), shell=True)

                os.chdir(origin_dir)
                os.system('rm -r {}'.format(fileorgpath))
            except:
                error_msg = 'create certificate or genesis block failed!'
                raise Exception(error_msg)
        return self._schema(ins)
    def list(self, filter_data={}):
        logger.info("filter data {}".format(filter_data))
        networks = modelv2.BlockchainNetwork.objects(__raw__=filter_data)
        return self._schema(networks, many=True)

    def sys_channelInfo_update(self, blockchain_network_id, peer_org_dicts):
        service_object = self.get_endpoints_list(blockchain_network_id)
        organizations_object = org_handler.get_by_networkid(self, blockchain_network_id)
        organizations=[]

        for each in organizations_object:
            organization = org_handler().schema(org_handler().get_by_id(each['id']))
            organizations.append(organization)

        body =\
            {
              "sysChannel": {
                "service_object": service_object,
                "organizations_object": organizations,
                "peer_org_dicts": peer_org_dicts
              }
            }
        headers = { "Content-Type": "application/json"}
        rest_api = 'http://user-dashboard:8081/v2/sys_channel/{}'.format(blockchain_network_id)
        res = requests.post(rest_api, data=json.dumps(body), headers=headers)
        if res.status_code == 200:
            print("update syschannel from order success")

        return

    def sys_channelOrderer_update(self, blockchain_network_id, orderer_org_dicts,request_host_ports):
        service_object = self.get_endpoints_list(blockchain_network_id)
        organizations_object = org_handler.get_by_networkid(self, blockchain_network_id)
        organizations=[]

        for each in organizations_object:
            organization = org_handler().schema(org_handler().get_by_id(each['id']))
            organizations.append(organization)

        body =\
            {
              "sysChannel": {
                "service_object": service_object,
                "organizations_object": organizations,
                "orderer_org_dicts": orderer_org_dicts,
                "request_host_ports":request_host_ports
              }
            }
        headers = { "Content-Type": "application/json"}
        rest_api = 'http://user-dashboard:8081/v2/sys_channel_orderer/{}'.format(blockchain_network_id)
        res = requests.post(rest_api, data=json.dumps(body), headers=headers)
        if res.status_code == 200:
            print("update syschannel from order success")

        return

    def userdashboard_mongo_delete(self, blockchain_network_id):
        rest_api = 'http://user-dashboard:8081/v2/resources'
        body = \
            {
                "blockchain_network_id": blockchain_network_id
            }
        headers = {"Content-Type": "application/json"}
        res = requests.post(rest_api, data=json.dumps(body), headers=headers)
        if res.status_code == 200:
            print("delete userdashboard Mongo datas success")

        return

    def remove_network(self, network):
        try:
            network.update(set__status='deleting')
            # remove cluster info from host
            logger.info("remove network from host, network:{}".format(network.id))

            # if org has referenced network, remove
            for org_id in network.peer_orgs:
                peer_org = org_handler().schema(org_handler().get_by_id(org_id))
                host_id = peer_org['host_id']
                host = host_handler.get_active_host_by_id(host_id)
                host.update(pull__clusters=network.id)
                org_obj = modelv2.Organization.objects.get(id=org_id)
                org_obj.update(unset__network=network.id)

            for org_id in network.orderer_orgs:
                orderer_org = org_handler().schema(org_handler().get_by_id(org_id))
                host_id = orderer_org['host_id']
                host = host_handler.get_active_host_by_id(host_id)
                host.update(pull__clusters=network.id)
                org_obj = modelv2.Organization.objects.get(id=org_id)
                org_obj.update(unset__network=network.id)

            # 从Userdashboard的mongo中删除该network相关的数据
            # self.userdashboard_mongo_delete(network.id)

            network.delete()
            filepath = '{}{}'.format(CELLO_MASTER_FABRIC_DIR, network.id)
            os.system('rm -rf {}'.format(filepath))

        except Exception as e:
            logger.error("network remove failed for {}".format(e))
            raise e












