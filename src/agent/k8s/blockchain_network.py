import logging
from common import log_handler, LOG_LEVEL
from agent.blockchain_network_base import BlockchainNetworkBase
from string import Template
import os
import yaml
from modules.models import modelv2
from uuid import uuid4
from kubernetes import client, config
from agent.k8s.network_operations import K8sNetworkOperation
from common.utils import K8S_CRED_TYPE, KAFKA_NODE_NUM, ZOOKEEPER_NODE_NUM, PROMETHEUS_EXPOSED_PORT, PROMETHEUS_NAMESPACE, \
    PROMETHEUS_NODE_EXPORTER_POD_PORT
import time
import requests
import json
from common.api_exception import BadRequest

from modules.organization import organizationHandler as org_handler
from modules import host_handler

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


# CELLO_WORKER_FABRIC_DIR mounts '/' of nfs container
CELLO_WORKER_FABRIC_DIR = '/opt/cello/'
# CELLO_MASTER_FABRIC_DIR is mounted by nfs container as '/'
CELLO_MASTER_FABRIC_DIR = '/opt/fabric/'

# DEPLOY_FILE_PATH = '/opt/fabric/{}/deploy'


fabric_image_version = {
    'v1.1': '1.1.0',
    'v1.4': '1.4.2'
}

fabric_peer_proto_11 = ['grpc', 'event']
fabric_peer_proto_14 = ['grpc', 'cc_listen']

def render(src, dest, **kw):
	t = Template(open(src, 'r').read())
	with open(dest, 'w') as f:
		f.write(t.substitute(**kw))

	##### For testing ########################
	##testDest = dest.split("/")[-1]	##
	##with open(TestDir+testDest, 'w') as d:##
	##d.write(t.substitute(**kw))      	##
	##########################################

def peer0DataPath(filename,service_name):
    try:
        f = open(filename)

        for dataNetwork in yaml.load_all(f):
            if dataNetwork['apiVersion'] == 'v1':
                data2 = dataNetwork
                continue
            else:
                data1 = dataNetwork
                volume = dataNetwork['spec']['template']['spec']['containers'][0]['volumeMounts']
                volume.append(dict(mountPath='/var/hyperledger/production', name='peerdata', subPath=service_name))
    except:
        raise BadRequest(msg="{}.yaml datas set error.".format(service_name))

    try:
        data = [data1,data2]
        dataread = [i for i in data]
        with open(filename,'w') as f:
            yaml.dump_all(dataread,f)
    except:
        error_msg = 'Yaml file dump filed, can not write date to  yaml file: {}.'.format(filename)
        raise BadRequest(msg=error_msg)

    f.close()


def getTemplate(templateName):
	baseDir = os.path.dirname(__file__)
	configTemplate = os.path.join(baseDir, "deploy_templates/" + templateName)
	return configTemplate

class NetworkOnKubenetes(BlockchainNetworkBase):

    def __init__(self):
        pass



    def _build_kube_config(self, host):

        k8s_params = host.k8s_param
        k8s_config = client.Configuration()
        k8s_config.host = k8s_params.get('K8SAddress')
        if not k8s_config.host.startswith("https://"):
            k8s_config.host = "https://" + k8s_config.host
        if k8s_params.get('K8SCredType') == K8S_CRED_TYPE['cert']:
            cert_content = k8s_params.get('K8SCert')
            key_content = k8s_params.get('K8SKey')
            k8s_config.cert_file = \
                config.kube_config._create_temp_file_with_content(cert_content)
            k8s_config.key_file = \
                config.kube_config._create_temp_file_with_content(key_content)

        if k8s_params.get('K8SUseSsl') == "false":
            k8s_config.verify_ssl = False
        else:
            k8s_config.verify_ssl = True
            k8s_config.ssl_ca_cert = config.kube_config._create_temp_file_with_content(k8s_params.get('K8SSslCert'))

        return k8s_config


    def create_peer_org(self, peer_org, couchdb_enabled, host, net_id, net_name, fabric_version, request_host_ports, portid):
        index = portid[0]
        peer_org_names = []
        net_dir = CELLO_MASTER_FABRIC_DIR + net_id
        deploy_dir = '/opt/fabric/{}/deploy'.format(net_id)
        if not os.path.exists(deploy_dir):
            os.mkdir(deploy_dir)
        # begin to construct python client to communicate with k8s
        kube_config = self._build_kube_config(host)
        operation = K8sNetworkOperation(kube_config)

        node_vip = host.k8s_param.get('K8SNodeVip')
        if node_vip is '':
            node_vip = operation.get_one_availabe_node_ip()
        if node_vip is '' or node_vip is None:
            raise Exception("No ready nodes in this k8s cluster")

        nfs_server = host.k8s_param.get('K8SNfsServer')

        peer_template = None

        if couchdb_enabled is True and fabric_version == '1.4.2':
            peer_template = getTemplate("peer_couchdb.yaml")

        if couchdb_enabled is False and fabric_version == '1.4.2':
            peer_template = getTemplate("peer1_4.yaml")

        pv_template = getTemplate("pv.yaml")

        namespaceTemplate = getTemplate("namespace.yaml")

        ca_tmplate = getTemplate("ca.yaml")

        # one network one k8s namespace
        namespace_file = '{deploy_dir}/namespace.yaml'. \
            format(deploy_dir=deploy_dir)
        render(namespaceTemplate, namespace_file, networkName=net_name)
        networklists = host.clusters
        exist = False
        for networklist in networklists:
            if networklist == net_id:
                exist = True
        # first create namespace for this network
        if exist == False:
            with open('{deploy_dir}/namespace.yaml'.format(deploy_dir=deploy_dir)) as f:
                resources = yaml.load_all(f)
                operation.deploy_k8s_resource(resources)

        org_name = peer_org['name']
        peer_org_names.append(org_name)
        org_domain = peer_org['domain']
        org_fullDomain_name = '.'.join([org_name, org_domain])

        org_deploydir = '{deploy_dir}/{org_name}'.format(deploy_dir=deploy_dir, org_name=org_name)
        org_data_path = '/opt/fabric/{}/data/{}'.format(net_id, org_name)
        if not os.path.exists(org_deploydir):
            os.mkdir(org_deploydir)
            org_pv_file = '{org_deploydir}/pv.yaml'.format(org_deploydir=org_deploydir)
            render(pv_template, org_pv_file, networkName=net_name,
                   credentialPV=org_name + '-credentialpv',
                   dataPV=org_name + '-datapv',
                   # this is different from fabric_on_kubernetes, because it is possible that
                   # a network owns more than one orderer org
                   # credentialPath='{net_dir}/crypto-config/ordererOrganizations/{org_domain}/'. \
                   # format(net_dir=net_dir, org_domain=orderer_domain),
                   credentialPath='/{net_id}/crypto-config/peerOrganizations/{org_fullDomain_name}/'. \
                   format(net_id=net_id, org_fullDomain_name=org_fullDomain_name),
                   dataPath='/{net_id}/data/{org_name}'. \
                   format(net_id=net_id, org_name=org_name),
                   nfsServer=nfs_server)

            # deploy
            with open('{}/pv.yaml'.format(org_deploydir)) as f:
                resources = yaml.load_all(f)
                operation.deploy_k8s_resource(resources)

        org_ca_file = '{org_deploydir}/ca.yaml'.format(org_deploydir=org_deploydir)
        host_port = request_host_ports[index]
        ca_service_name = '.'.join(['ca', org_name, org_domain])
        k8s_ca_name = 'ca-{}'.format(org_name)

        sk_file = ''
        ca_dir = '{net_dir}/crypto-config/peerOrganizations/{org_fullDomain_name}/ca/'. \
            format(net_dir=net_dir, org_fullDomain_name=org_fullDomain_name)
        for f in os.listdir(ca_dir):  # find out sk!
            if f.endswith("_sk"):
                sk_file = f
        cert_file = '/etc/hyperledger/fabric-ca-server-config/ca.{}-cert.pem'.format(org_fullDomain_name)
        key_file = '/etc/hyperledger/fabric-ca-server-config/{}'.format(sk_file)
        command = "'fabric-ca-server start -b admin:adminpw -d --config /etc/hyperledger/fabric-ca-server-config/fabric-ca-server-config.yaml'"
        if not os.path.exists('{}/ca'.format(org_data_path)):
            os.makedirs('{}/ca'.format(org_data_path))
            render(ca_tmplate, org_ca_file, command=command,
                   networkName=net_name,
                   orgDomain=org_fullDomain_name,
                   caSvcName=k8s_ca_name,
                   podName=k8s_ca_name,
                   fabVersion=fabric_version,
                   tlsCert=cert_file,
                   tlsKey=key_file,
                   caPath='ca/',
                   caDataPath='ca/',
                   credentialPV=org_name + '-credentialpv',
                   dataPV=org_name + '-datapv',
                   nodePort=host_port
                   )

            ca_service_endpoint = modelv2.ServiceEndpoint(id=uuid4().hex,
                                                          service_ip=node_vip,
                                                          service_port=host_port,
                                                          service_name=ca_service_name,
                                                          service_type='ca',
                                                          org_name=org_name,
                                                          network=modelv2.BlockchainNetwork.objects.get(id=net_id)
                                                          )
            ca_service_endpoint.save()

            index += 1

            # deploy
            with open('{}/ca.yaml'.format(org_deploydir)) as f:
                resources = yaml.load_all(f)
                operation.deploy_k8s_resource(resources)

        for i in range(int(peer_org['peerNum'])):
            peer_name = 'peer{}'.format(i)
            peer_seq = [peer_name, org_name, org_domain]
            peer_service_name = '.'.join(peer_seq)

            if couchdb_enabled is True:
                k8s_peer_name = '{}-{}'.format(peer_name, org_name)
                peer_deploy_file = '{org_deploydir}/deploy_{peer_service_name}.yaml'. \
                    format(org_deploydir=org_deploydir, peer_service_name=peer_service_name)
                if not os.path.exists('{}/{}'.format(org_data_path, peer_service_name))
                    os.makedirs('{}/{}'.format(org_data_path, peer_service_name))
                    couchdb_service_name = 'couchdb.{peer_service_name}'.format(peer_service_name=peer_service_name)
                    if not os.path.exists('{}/{}'.format(org_data_path, couchdb_service_name)):
                        os.makedirs('{}/{}'.format(org_data_path, couchdb_service_name))

                        host_ports = [request_host_ports[index], request_host_ports[index + 1],
                                      request_host_ports[index + 2]]
                        index = index + 3
                        # couchdb is enabled by default
                        render(peer_template, peer_deploy_file, networkName=net_name,
                           orgDomain=org_fullDomain_name,
                           peerSvcName=k8s_peer_name,
                           podName=k8s_peer_name,
                           fabVersion=fabric_version,
                           peerID=peer_name,
                           corePeerID=k8s_peer_name,
                           peerAddress='{}:7051'.format(k8s_peer_name),
                           localMSPID='{}MSP'.format(org_name[0:1].upper() + org_name[1:]),
                           mspPath='peers/{}/msp'.format(peer_service_name),
                           tlsPath='peers/{}/tls'.format(peer_service_name),
                           dataPath=peer_service_name,
                           couchDataPath=couchdb_service_name,
                           credentialPV=org_name + '-credentialpv',
                           dataPV=org_name + '-datapv',
                           nodePort1=host_ports[0],
                           nodePort2=host_ports[1],
                           nodePort3=host_ports[2])

                        couchdb_service_endpoint = modelv2.ServiceEndpoint(id=uuid4().hex,
                                                                       service_ip=node_vip,
                                                                       service_port=host_ports[2],
                                                                       service_name=couchdb_service_name,
                                                                       service_type='couchdb',
                                                                       org_name=org_name,
                                                                       network=modelv2.BlockchainNetwork.objects.get(
                                                                       id=net_id)
                                                                       )
                        couchdb_service_endpoint.save()
                    # 仅仅peer0做持久化存储. 注释掉暂时不做任何持久化存储
                    # if peer_service_name.split('.')[0][-1] == '0':
                    #    peer0DataPath(peer_deploy_file, peer_service_name)

                        for i in range(2):
                            peer_service_endpoint = modelv2.ServiceEndpoint(id=uuid4().hex,
                                                                        service_ip=node_vip,
                                                                        service_port=host_ports[i],
                                                                        service_name=peer_service_name,
                                                                        service_type='peer',
                                                                        org_name=org_name,
                                                                        peer_port_proto=fabric_peer_proto_14[i],
                                                                        network=modelv2.BlockchainNetwork.objects.get(
                                                                            id=net_id)
                                                                        )
                            peer_service_endpoint.save()

                    # deploy
                        with open(peer_deploy_file) as f:
                            resources = yaml.load_all(f)
                            operation.deploy_k8s_resource(resources)
            else:
                k8s_peer_name = '{}-{}'.format(peer_name, org_name)
                peer_deploy_file = '{org_deploydir}/deploy_{peer_service_name}.yaml'. \
                    format(org_deploydir=org_deploydir, peer_service_name=peer_service_name)
                if not os.path.exists('{}/{}'.format(org_data_path, peer_service_name)):
                    os.makedirs('{}/{}'.format(org_data_path, peer_service_name))
                    host_ports = [request_host_ports[index], request_host_ports[index + 1]]
                    index = index + 2

                    # couchdb is enabled by default
                    render(peer_template, peer_deploy_file, networkName=net_name,
                           orgDomain=org_fullDomain_name,
                           peerSvcName=k8s_peer_name,
                           podName=k8s_peer_name,
                           fabVersion=fabric_version,
                           peerID=peer_name,
                           corePeerID=k8s_peer_name,
                           peerAddress='{}:7051'.format(k8s_peer_name),
                           localMSPID='{}MSP'.format(org_name[0:1].upper() + org_name[1:]),
                           mspPath='peers/{}/msp'.format(peer_service_name),
                           tlsPath='peers/{}/tls'.format(peer_service_name),
                           dataPath=peer_service_name,
                           credentialPV=org_name + '-credentialpv',
                           dataPV=org_name + '-datapv',
                           nodePort1=host_ports[0],
                           nodePort2=host_ports[1])

                    # 仅仅peer0做持久化存储. 注释掉暂时不做任何持久化存储
                    # if peer_service_name.split('.')[0][-1] == '0':
                    #    peer0DataPath(peer_deploy_file, peer_service_name)

                    for i in range(2):
                        peer_service_endpoint = modelv2.ServiceEndpoint(id=uuid4().hex,
                                                                        service_ip=node_vip,
                                                                        service_port=host_ports[i],
                                                                        service_name=peer_service_name,
                                                                        service_type='peer',
                                                                        org_name=org_name,
                                                                        peer_port_proto=fabric_peer_proto_14[i],
                                                                        network=modelv2.BlockchainNetwork.objects.get(
                                                                            id=net_id)
                                                                        )
                        peer_service_endpoint.save()

                    # deploy
                    with open(peer_deploy_file) as f:
                        resources = yaml.load_all(f)
                        operation.deploy_k8s_resource(resources)

        portid[0] = index
    def create_orderer_org(self, orderer_org, consensus_type, host, net_id, net_name, fabric_version,  request_host_ports, portid):
        index = portid[0]
        orderer_org_names = []
        deploy_dir = '/opt/fabric/{}/deploy'.format(net_id)
        if not os.path.exists(deploy_dir):
            os.mkdir(deploy_dir)
        # begin to construct python client to communicate with k8s
        kube_config = self._build_kube_config(host)
        operation = K8sNetworkOperation(kube_config)

        node_vip = host.k8s_param.get('K8SNodeVip')
        if node_vip is '':
            node_vip = operation.get_one_availabe_node_ip()
        if node_vip is '' or  node_vip is None:
            raise Exception("No ready nodes in this k8s cluster")

        nfs_server = host.k8s_param.get('K8SNfsServer')

        orderer_template = getTemplate("orderer1_4.yaml")

        pv_template = getTemplate("pv.yaml")

        networklists = host.clusters
        exist = False
        for networklist in networklists:
            if networklist == net_id:
                exist = True
        # first create namespace for this network
        if exist == False:
            namespaceTemplate = getTemplate("namespace.yaml")

            # one network one k8s namespace
            namespace_file = '{deploy_dir}/namespace.yaml'. \
                format(deploy_dir=deploy_dir)
            render(namespaceTemplate, namespace_file, networkName=net_name)

            # first create namespace for this network
            with open('{deploy_dir}/namespace.yaml'.format(deploy_dir=deploy_dir)) as f:
                resources = yaml.load_all(f)
                operation.deploy_k8s_resource(resources)

            # kafka support
            if consensus_type == 'kafka':
                kafka_template = getTemplate("kafka.yaml")
                zookeeper_template = getTemplate("zookeeper.yaml")
                zookeeper_pvc_template = getTemplate("zookeeper_pvc.yaml")
                zookeeper_pv_template = getTemplate("zookeeper_pv.yaml")
                kafka_pvc_template = getTemplate("kafka_pvc.yaml")
                kafka_pv_template = getTemplate("kafka_pv.yaml")

                zookeeper_pv_deploy_file = '{}/zookeeper_pv.yaml'.format(deploy_dir)
                zookeeper_pvc_deploy_file = '{}/zookeeper_pvc.yaml'.format(deploy_dir)
                kafka_pv_deploy_file = '{}/kafka_pv.yaml'.format(deploy_dir)
                kafka_pvc_deploy_file = '{}/kafka_pvc.yaml'.format(deploy_dir)
                kafka_deploy_file = '{}/kafka.yaml'.format(deploy_dir)
                zookeeper_deploy_file = '{}/zookeeper.yaml'.format(deploy_dir)

                for i in range(KAFKA_NODE_NUM):
                    kafka_node_datadir = '/opt/fabric/{}/data/kafka-{}'.format(net_id, i)
                    os.makedirs(kafka_node_datadir)

                for i in range(ZOOKEEPER_NODE_NUM):
                    zookeeper_node_datadir = '/opt/fabric/{}/data/zoo-{}'.format(net_id, i)
                    os.makedirs(zookeeper_node_datadir)



                render(zookeeper_pv_template, zookeeper_pv_deploy_file,
                       path='/{}/data'.format(net_id),
                       networkName=net_name,
                       nfsServer=nfs_server)
                render(kafka_pv_template, kafka_pv_deploy_file,
                       path='/{}/data'.format(net_id),
                       networkName=net_name,
                       nfsServer=nfs_server)

                render(kafka_pvc_template, kafka_pvc_deploy_file, networkName=net_name)
                render(zookeeper_pvc_template, zookeeper_pvc_deploy_file, networkName=net_name)
                render(zookeeper_template, zookeeper_deploy_file, networkName=net_name)
                render(kafka_template, kafka_deploy_file, networkName=net_name)

                with open('{}/kafka_pv.yaml'.format(deploy_dir)) as f:
                    resources = yaml.load_all(f)
                    operation.deploy_k8s_resource(resources)
                with open('{}/kafka_pvc.yaml'.format(deploy_dir)) as f:
                    resources = yaml.load_all(f)
                    operation.deploy_k8s_resource(resources)
                with open('{}/zookeeper_pv.yaml'.format(deploy_dir)) as f:
                    resources = yaml.load_all(f)
                    operation.deploy_k8s_resource(resources)
                with open('{}/zookeeper_pvc.yaml'.format(deploy_dir)) as f:
                    resources = yaml.load_all(f)
                    operation.deploy_k8s_resource(resources)
                with open('{}/zookeeper.yaml'.format(deploy_dir)) as f:
                    resources = yaml.load_all(f)
                    operation.deploy_k8s_resource(resources)
                # kafka depends on zookeeper
                time.sleep(5)
                with open('{}/kafka.yaml'.format(deploy_dir)) as f:
                    resources = yaml.load_all(f)
                    operation.deploy_k8s_resource(resources)

            time.sleep(10)

        orderer_domain = orderer_org['domain']
        org_name = orderer_org['name']
        orderer_org_names.append(org_name)
        org_deploydir = '{deploy_dir}/{org_name}'.format(deploy_dir=deploy_dir, org_name=org_name)
        os.mkdir(org_deploydir)
        orderer_pv_file = '{org_deploydir}/pv.yaml'.format(org_deploydir=org_deploydir)
        org_data_path = '/opt/fabric/{}/data/{}'.format(net_id, org_name)
        render(pv_template, orderer_pv_file, networkName=net_name,
               credentialPV=org_name + '-credentialpv',
               dataPV=org_name + '-datapv',
               # this is different from fabric_on_kubernetes, because it is possible that
               # a network owns more than one orderer org
               # credentialPath='{net_dir}/crypto-config/ordererOrganizations/{org_domain}/'. \
               # format(net_dir=net_dir, org_domain=orderer_domain),
               credentialPath='/{net_id}/crypto-config/ordererOrganizations/'. \
               format(net_id=net_id),
               dataPath='/{net_id}/data/{org_name}'. \
               format(net_id=net_id, org_name=org_name),
               nfsServer=nfs_server)

        for hostname in orderer_org['ordererHostnames']:
            host_port = request_host_ports[index]

            orderer_service_name = '.'.join([hostname, orderer_domain])
            host_deploy_file = '{org_deploydir}/deploy_{orderer_service_name}.yaml'. \
                format(org_deploydir=org_deploydir, orderer_service_name=orderer_service_name)
            k8s_orderer_name = '{}-{}'.format(hostname, org_name)
            temp_port = '"' + str(host_port) + '"'
            os.makedirs('{}/{}'.format(org_data_path, orderer_service_name))
            render(orderer_template, host_deploy_file,
                   networkName=net_name,
                   orgDomain=orderer_domain,
                   ordererSvcName=k8s_orderer_name,
                   podName=k8s_orderer_name,
                   fabVersion=fabric_version,
                   localMSPID='{}MSP'.format(org_name[0:1].upper() + org_name[1:]),
                   mspPath='{orderer_domain}/orderers/{orderer_service_name}/msp'. \
                   format(orderer_domain=orderer_domain, orderer_service_name=orderer_service_name),
                   tlsPath='{orderer_domain}/orderers/{orderer_service_name}/tls'. \
                   format(orderer_domain=orderer_domain, orderer_service_name=orderer_service_name),
                   ordererDataPath=orderer_service_name,
                   credentialPV=org_name + '-credentialpv',
                   dataPV=org_name + '-datapv',
                   ordererID=hostname,
                   listenPort=temp_port,
                   containerPort=host_port,
                   targetPort=host_port,
                   port=host_port,
                   nodePort=host_port)

            # save orderer service endpoint to db
            # if container run failed, then delete network
            # according to reference, corresponding service endpoint
            # would be delete automatically
            orderer_service_endpoint = modelv2.ServiceEndpoint(id=uuid4().hex,
                                                               service_ip=node_vip,
                                                               service_port=host_port,
                                                               service_name=orderer_service_name,
                                                               service_type='orderer',
                                                               org_name=org_name,
                                                               network=modelv2.BlockchainNetwork.objects.get(
                                                                   id=net_id)
                                                               )
            orderer_service_endpoint.save()
            index = index + 1

        with open('{}/pv.yaml'.format(org_deploydir)) as f:
            resources = yaml.load_all(f)
            operation.deploy_k8s_resource(resources)

        for deploy_file in os.listdir(org_deploydir):
            if deploy_file.startswith('deploy_'):
                with open('{}/{}'.format(org_deploydir, deploy_file)) as f:
                    resources = yaml.load_all(f)
                    operation.deploy_k8s_resource(resources)


        portid[0] = index

    def delete_peer_org(self, peer_org, host, net_id):
        deploy_dir = '/opt/fabric/{}/deploy'.format(net_id)
        # begin to construct python client to communicate with k8s
        kube_config = self._build_kube_config(host)
        operation = K8sNetworkOperation(kube_config)

        networklists = host.clusters
        exist = False
        for networklist in networklists:
            if networklist == net_id:
                exist = True
        # first create namespace for this network
        if exist == True:
            with open('{deploy_dir}/namespace.yaml'.format(deploy_dir=deploy_dir)) as f:
                resources = yaml.load_all(f)
                operation.delete_k8s_resource(resources)

        peer_dir = '{deploy_dir}/{org_name}'.format(deploy_dir=deploy_dir, org_name=peer_org['name'])
        with open('{}/pv.yaml'.format(peer_dir)) as f:
            resources = yaml.load_all(f)
            operation.delete_k8s_resource(resources)
    def delete_orderer_org(self, orderer_org, consensus_type, host, net_id):
        deploy_dir = '/opt/fabric/{}/deploy'.format(net_id)
        # begin to construct python client to communicate with k8s
        kube_config = self._build_kube_config(host)
        operation = K8sNetworkOperation(kube_config)

        networklists = host.clusters
        exist = False
        for networklist in networklists:
            if networklist == net_id:
                exist = True
        # first create namespace for this network
        if exist == True:
            with open('{deploy_dir}/namespace.yaml'.format(deploy_dir=deploy_dir)) as f:
                resources = yaml.load_all(f)
                operation.delete_k8s_resource(resources)

            if consensus_type == 'kafka':
                # if consensus_type is kafka
                with open('{deploy_dir}/kafka_pv.yaml'.format(deploy_dir=deploy_dir)) as f:
                    resources = yaml.load_all(f)
                    operation.delete_k8s_resource(resources)

                with open('{deploy_dir}/zookeeper_pv.yaml'.format(deploy_dir=deploy_dir)) as f:
                    resources = yaml.load_all(f)
                    operation.delete_k8s_resource(resources)

        orderer_dir = '{deploy_dir}/{org_name}'.format(deploy_dir=deploy_dir, org_name=orderer_org['name'])
        with open('{}/pv.yaml'.format(orderer_dir)) as f:
            resources = yaml.load_all(f)
            operation.delete_k8s_resource(resources)
























































    
