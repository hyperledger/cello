

import os
import yaml
from common.api_exception import BadRequest, NotFound
import logging
from common import log_handler, LOG_LEVEL
from modules import host_handler
logger = logging.getLogger(__name__)


logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

class FileOperaterFailed(Exception):

    """*-1* `FileOperaterFailed`

    Raise if a resource open failed or read/write failed.
    """
    code = -1
    description = (
        'File Operater Failed '
    )
CELLO_MASTER_FABRIC_DIR = '/opt/fabric/'
CELLO_SECRET_FOR_TOKEN_DIR = '/opt/secret/'

def creat_secret_key_files():
    # if has exist, just return, if not, create them.
    pri = '{}private.key'.format(CELLO_SECRET_FOR_TOKEN_DIR)
    pub = '{}public.key'.format(CELLO_SECRET_FOR_TOKEN_DIR)
    isExist = os.path.exists(pri) and os.path.exists(pub)
    print('isExist:',isExist)
    if isExist:
        pass
    else:
        try:
            # If the path is not exist, create one. else pass in order to not going to error.
            pathExist = os.path.exists(CELLO_SECRET_FOR_TOKEN_DIR)
            if not pathExist:
                os.system('mkdir {}'.format(CELLO_SECRET_FOR_TOKEN_DIR))
            os.chdir(CELLO_SECRET_FOR_TOKEN_DIR)
            os.system('ssh-keygen -t rsa -b 2048 -f private.key')
            os.system('openssl rsa -in private.key -pubout -outform PEM -out public.key')
        except:
            error_msg = 'private.key or public.key create failed'.format()
            raise BadRequest(msg=error_msg)
    isSuccess = os.path.exists(pri) and os.path.exists(pub)
    print('isSucces:',isSuccess)
    return isSuccess


def commad_create_path(network_id):

    filepath = '{}{}'.format(CELLO_MASTER_FABRIC_DIR,network_id)

    logger.info("before commad_create_path: {}".format(filepath))
    try:
        os.system('mkdir -p {}'.format(filepath))
    except:
        error_msg='Network file create failed, networkid={}'.format(network_id)
        raise BadRequest(msg=error_msg)

    isSuccess = os.path.exists(filepath)
    logger.info(" is = {}".format(isSuccess))
    if not isSuccess:
        message = "commad_create_path: {} failed, is = {}".format(filepath,isSuccess)
        raise NotFound(msg = message)

    return filepath


def load_yaml_file():
    try:
        f = open('agent/docker/_compose_files/fabric-1.0/crypto-config.yaml')
        dataMap = yaml.load(f)
    except:
        raise BadRequest(msg = "load crypto-config.yaml file to data failed!")
    finally:
        f.close()
    return dataMap

def dump_crypto_config_yaml_file(filepath,peer_org_dicts,orderer_org_dicts):
    listOrderer = []
    listPeer = []

    try:
        dataNetwork = dict(OrdererOrgs=listOrderer,PeerOrgs=listPeer)

        for each_peer in peer_org_dicts:
            if each_peer['ca']:
                ca = dict(Country=each_peer['ca']['country'],Locality=each_peer['ca']['locality'],Province=each_peer['ca']['province'])
            else :
                ca={}

            peer_specs = []
            for i in range(each_peer['peerNum']):
                hostname = 'peer{}'.format(i)
                svc_name = '{}-{}'.format(hostname, each_peer['name'])
                one_spec = dict(Hostname=hostname, SANS=[svc_name])
                peer_specs.append(one_spec)
            listPeer.append(dict(Domain='{}.{}'.format(each_peer['name'], each_peer['domain']),
                                 Name=each_peer['name'][0:1].upper()+each_peer['name'][1:], CA=ca,
                                 Specs=peer_specs, EnableNodeOUs=each_peer['enableNodeOUs']))

        for each_orderer in orderer_org_dicts:
            if each_orderer['ca']:
                ca = dict(Country=each_orderer['ca']['country'], Locality=each_orderer['ca']['locality'], Province=each_orderer['ca']['province'])
            else :
                ca={}
            specs = []
            for orderhost in each_orderer['ordererHostnames']:
                svc_name = '{}-{}'.format(orderhost, each_orderer['name'])
                specs.append(dict(Hostname=orderhost, SANS=[svc_name]))
            listOrderer.append(dict(Domain=each_orderer['domain'],
                                    Name=each_orderer['name'][0:1].upper()+each_orderer['name'][1:], CA=ca, Specs=specs))

        filename = '{}/crypto-config.yaml'.format(filepath)
    except:
        raise BadRequest(msg="cryptoconfit.yaml datas set error")

    try:
        f = open(filename,'w',encoding = 'utf-8')
    except IOError:
        error_msg='File open filed, can not open yaml file: {}.'.format(filename)
        raise BadRequest(msg=error_msg)

    try:
        yaml.dump(dataNetwork,f)
    except:
        error_msg = 'Yaml file dump filed, can not write date to  yaml file: {}.'.format(filename)
        raise BadRequest(msg=error_msg)

    f.close()

def dump_configtx_yaml_file(filepath,consensus_type,peer_org_dicts,orderer_org_dicts,fabric_version,request_host_ports):
    DictApplication = {'Organizations':None}
    ListPeerOrganizations = []
    ListOrdererOrganizations = []
    OrdererAddress = []
    index = 0
    DictOption = []

    try:
        for each in orderer_org_dicts:
            for eachOrder in each['ordererHostnames']:
                OrdererAddress.append('{}-{}:{}'.format(eachOrder, each['name'], request_host_ports[index]))

                index = index + 1
        DictOrderer={'BatchTimeout':'2s','Organizations':None,'Addresses':OrdererAddress,\
                        'OrdererType':consensus_type,'BatchSize':{'AbsoluteMaxBytes':'98 MB','MaxMessageCount':100,'PreferredMaxBytes':'8192 KB'}}

        if consensus_type == 'kafka':
            DictOrderer['Kafka']=dict(Brokers=['kafka-0.kafka:9092', 'kafka-1.kafka:9092', 'kafka-2.kafka:9092', 'kafka-3.kafka:9092'])
        elif consensus_type == 'etcdraft':
            ListConsenters = []
            times = "600ms"
            size = "20 MB"
            index = 0
            for each in orderer_org_dicts:
                for eachOrder in each['ordererHostnames']:
                    ListConsenters.append(dict(Host='{}-{}'.format(eachOrder, each['name']),
                                               Port='{}'.format(request_host_ports[index]),
                                               ClientTLSCert='crypto-config/ordererOrganizations/{}/orderers/{}.{}/tls/server.crt'.format(
                                                   each['domain'], eachOrder, each['domain']),
                                               ServerTLSCert='crypto-config/ordererOrganizations/{}/orderers/{}.{}/tls/server.crt'.format(
                                                   each['domain'], eachOrder, each['domain'])))

                    index = index + 1
            DictOption = {'TickInterval':times,'ElectionTick':10,'HeartbeatTick':1, 'MaxInflightBlocks':5,'SnapshotIntervalSize':size}
            DictOrderer['EtcdRaft'] = dict(Consenters=ListConsenters,Options=DictOption)


        Va = fabric_version.replace('v','V')
        Vb = Va.replace('.', '_')


        # 网络起不来，orderer的capabilities不支持V1_4. orderer目前只支持V1_1. 先写死。
        DictCapabilities = {'Global': {Vb: True}, 'Orderer': {'V1_1': True}, 'Application': {'V1_1': True}}

        for each in orderer_org_dicts:
            ListOrdererOrganizations.append(dict(MSPDir='crypto-config/ordererOrganizations/{}/msp'.format(each['domain']),
                                      Name='{}Org'.format(each['name'][0:1].upper()+each['name'][1:]),
                                                 ID='{}MSP'.format(each['name'][0:1].upper()+each['name'][1:])))

        for each in peer_org_dicts:
            ListPeerOrganizations.append(dict(MSPDir='crypto-config/peerOrganizations/{}.{}/msp'.format(each['name'],each['domain']),
                                      AnchorPeers=[{'Port': 7051, 'Host': 'peer0-{}'.format(each['name'])}],
                                      Name='{}MSP'.format(each['name'][0:1].upper()+each['name'][1:]),
                                              ID='{}MSP'.format(each['name'][0:1].upper()+each['name'][1:])))

        ListOrganizations = ListOrdererOrganizations + ListPeerOrganizations

        #'TwoOrgsChannel':{'Application': {'Capabilities':{Vb:True},'Organizations':ListPeerOrganizations},'Consortium':'SampleConsortium'}
        DictProfiles={'TwoOrgsOrdererGenesis':{'Orderer':{'BatchTimeout':'2s','Organizations':ListOrdererOrganizations,'Addresses':DictOrderer['Addresses'],\
                        'OrdererType':consensus_type,'Capabilities':{'V1_1':True},'BatchSize':DictOrderer['BatchSize']}, \
                            'Consortiums':{'SampleConsortium':{'Organizations':ListPeerOrganizations}}}}
        if consensus_type == 'kafka':
            DictProfiles['TwoOrgsOrdererGenesis']['Orderer']['Kafka']=dict(Brokers=['kafka-0.kafka:9092', 'kafka-1.kafka:9092', 'kafka-2.kafka:9092', 'kafka-3.kafka:9092'])
        elif consensus_type == 'etcdraft':
            DictProfiles['TwoOrgsOrdererGenesis']['Orderer']['EtcdRaft'] = dict(Consenters=ListConsenters,Options=DictOption)

        dataConfig = dict(Application=DictApplication,Orderer=DictOrderer,Capabilities=DictCapabilities,Profiles=DictProfiles,Organizations=ListOrganizations)

        filename = '{}/configtx.yaml'.format(filepath)
    except Exception as e:
        print (e)
        raise BadRequest(msg="configtx.yaml datas set error")

    try:
        f = open(filename, 'w', encoding='utf-8')
    except IOError:
        error_msg = 'File open filed, can not open yaml file: {}.'.format(filename)
        raise BadRequest(msg=error_msg)

    try:
        yaml.dump(dataConfig, f)
    except:
        error_msg = 'Yaml file dump filed, can not write date to  yaml file: {}.'.format(filename)
        raise BadRequest(msg=error_msg)

    f.close()

    return

def fabric_ca_config_files(id, fabric_version, CELLO_MASTER_FABRIC_DIR, peer_org_dicts):
    try:
        fabric_version_dir = fabric_version.replace('.', '_')
        for each in peer_org_dicts:
            orgName = each['name']
            orgDomain = each['domain']
            peerPath = '{}{}/crypto-config/peerOrganizations/{}.{}/ca/'.format(CELLO_MASTER_FABRIC_DIR, id, orgName, orgDomain)
            os.system('cp /opt/fabric_tools/{}/fabric-ca-server-config.yaml {}'.format(fabric_version_dir, peerPath))
    except Exception:
        error_msg = 'cp fabric-ca-server-config.yaml to path {} failed.'.format(peerPath)
        raise BadRequest(msg=error_msg)
    return

def update_crypto_config_yaml_file(filepath, peer_org_dicts, orderer_org_dicts):
    filename = '{}/crypto-config.yaml'.format(filepath)

    try:
        f = open(filename)
    except IOError:
        error_msg = 'File open filed, can not open yaml file: {}.'.format(filename)
        raise BadRequest(msg=error_msg)

    try:
        dataNetwork = yaml.load(f)
        listPeer = dataNetwork['PeerOrgs']
        listOrderer = dataNetwork['OrdererOrgs']

        for each_peer in peer_org_dicts:
            if each_peer['ca']:
                ca = dict(Country=each_peer['ca']['country'], Locality=each_peer['ca']['locality'],
                          Province=each_peer['ca']['province'])
            else:
                ca = {}

            peer_specs = []
            for i in range(each_peer['peerNum']):
                hostname = 'peer{}'.format(i)
                svc_name = '{}-{}'.format(hostname, each_peer['name'])
                one_spec = dict(Hostname=hostname, SANS=[svc_name])
                peer_specs.append(one_spec)
            listPeer.append(
                dict(Domain='{}.{}'.format(each_peer['name'], each_peer['domain']), Name=each_peer['name'].title(),
                     CA=ca, \
                     Specs=peer_specs, EnableNodeOUs=each_peer['enableNodeOUs']))

        for each_orderer in orderer_org_dicts:
            if each_orderer['ca']:
                ca = dict(Country=each_orderer['ca']['country'], Locality=each_orderer['ca']['locality'], Province=each_orderer['ca']['province'])
            else :
                ca={}
            specs = []
            for orderhost in each_orderer['ordererHostnames']:
                svc_name = '{}-{}'.format(orderhost, each_orderer['name'])
                specs.append(dict(Hostname=orderhost, SANS=[svc_name]))
            listOrderer.append(dict(Domain=each_orderer['domain'],
                                    Name=each_orderer['name'][0:1].upper()+each_orderer['name'][1:], CA=ca, Specs=specs))

    except:
        raise BadRequest(msg="cryptoconfit.yaml datas set error")


    try:
        f = open(filename,'w')
        yaml.dump(dataNetwork,f)
    except:
        error_msg = 'Yaml file dump filed, can not write date to  yaml file: {}.'.format(filename)
        raise BadRequest(msg=error_msg)

    f.close()

def update_dump_configtx_yaml_file(filepath, peer_org_dicts, orderer_org_dicts, request_host_ports):

    filename = '{}/configtx.yaml'.format(filepath)
    try:
        f = open(filename)
    except IOError:
        error_msg = 'File open filed, can not open yaml file: {}.'.format(filename)
        raise BadRequest(msg=error_msg)

    try:
        index = 0
        dataNetwork = yaml.load(f)
        DictOrderer = dataNetwork['Orderer']
        ListOrganizations = dataNetwork['Organizations']
        DictProfiles = dataNetwork['Profiles']
        ListPeerOrganizations = []
        ListOrdererOrganizations = []

        if DictOrderer['OrdererType'] == 'etcdraft':
            OrdererAddress = DictOrderer['Addresses']
            ListOrdererType = DictOrderer['EtcdRaft']
            ListConsenters = ListOrdererType['Consenters']
            DictOption = DictOrderer['EtcdRaft']['Options']
            ListOrdererOrganizations_old = DictProfiles['TwoOrgsOrdererGenesis']['Orderer']['Organizations']
            for each in orderer_org_dicts:
                for eachOrder in each['ordererHostnames']:
                    OrdererAddress.append('{}-{}:{}'.format(eachOrder,each['name'],request_host_ports[index]))
                    ListConsenters.append(dict(Host='{}-{}'.format(eachOrder, each['name']),
                                               Port='{}'.format(request_host_ports[index]),
                                               ClientTLSCert='crypto-config/ordererOrganizations/{}/orderers/{}.{}/tls/server.crt'.format(
                                                   each['domain'], eachOrder, each['domain']),
                                               ServerTLSCert='crypto-config/ordererOrganizations/{}/orderers/{}.{}/tls/server.crt'.format(
                                                   each['domain'], eachOrder, each['domain'])))
                    index = index + 1
                ListOrdererOrganizations.append(dict(MSPDir='crypto-config/ordererOrganizations/{}/msp'.format(each['domain']),
                                                Name='{}Org'.format(each['name'][0:1].upper()+each['name'][1:]),
                                                     ID='{}MSP'.format(each['name'][0:1].upper()+each['name'][1:])))

            DictOrderer['Addresses']= OrdererAddress
            DictOrderer['EtcdRaft'] = dict(Consenters=ListConsenters,Options=DictOption)
            dataNetwork['Orderer'] = DictOrderer

            DictProfiles['TwoOrgsOrdererGenesis']['Orderer']['EtcdRaft'] = dict(Consenters=ListConsenters, Options=DictOption)
            DictProfiles['TwoOrgsOrdererGenesis']['Orderer']['Addresses'] = OrdererAddress
            DictProfiles['TwoOrgsOrdererGenesis']['Orderer']['Organizations'] = ListOrdererOrganizations_old + ListOrdererOrganizations

        for each in peer_org_dicts:
            ListPeerOrganizations.append(dict(MSPDir='crypto-config/peerOrganizations/{}.{}/msp'.format(each['name'], each['domain']),
                                              AnchorPeers=[{'Port': 7051, 'Host': 'peer0.{}.{}'.format(each['name'],each['domain'])}],
                                              Name='{}MSP'.format(each['name'][0:1].upper()+each['name'][1:]),
                                              ID='{}MSP'.format(each['name'][0:1].upper()+each['name'][1:])))

        ListOrganizations_new = ListOrganizations + ListOrdererOrganizations + ListPeerOrganizations

        DictProfiles['TwoOrgsOrdererGenesis']['Consortiums']['SampleConsortium']['Organizations'] = ListOrganizations_new

        dataNetwork['Profiles'] = DictProfiles
        dataNetwork['Organizations'] = ListOrganizations_new

    except:
        raise BadRequest(msg="configtx.yaml datas set error")

    try:
        f = open(filename, 'w')
        yaml.dump(dataNetwork, f)
    except:
        error_msg = 'Yaml file dump filed, can not write date to  yaml file: {}.'.format(filename)
        raise BadRequest(msg=error_msg)

    f.close()
    return

def update_crypto_file_for_addpeers(filepath, peer_org_dict, peers_num):
    filename = '{}/crypto-config.yaml'.format(filepath)

    try:
        f = open(filename)
    except IOError:
        error_msg = 'File open filed, can not open yaml file: {}.'.format(filename)
        raise BadRequest(msg=error_msg)

    try:
        dataNetwork = yaml.load(f)
        listPeer = dataNetwork['PeerOrgs']

        for each_peer in listPeer:
            if each_peer['Domain'] == '{}.{}'.format(peer_org_dict['name'], peer_org_dict['domain']):
                peer_specs = each_peer['Specs']
                peers_exist = len(peer_specs)
                for i in range(peers_num):
                    id  = peers_exist + i
                    hostname = 'peer{}'.format(id)
                    svc_name = '{}-{}'.format(hostname, peer_org_dict['name'])
                    one_spec = dict(Hostname=hostname, SANS=[svc_name])
                    peer_specs.append(one_spec)
                break

    except:
        raise BadRequest(msg="cryptoconfit.yaml datas set error")


    try:
        f = open(filename,'w')
        yaml.dump(dataNetwork,f)
    except:
        error_msg = 'Yaml file dump filed, can not write date to  yaml file: {}.'.format(filename)
        raise BadRequest(msg=error_msg)

    f.close()