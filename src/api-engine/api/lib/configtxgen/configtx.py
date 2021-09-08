#
# SPDX-License-Identifier: Apache-2.0
#
import yaml
import os
from api.config import CELLO_HOME


class ConfigTX:
    """Class represents crypto-config yaml."""

    def __init__(self, network, filepath=CELLO_HOME, orderer=None, raft_option=None):
        """init ConfigTX
                param:
                    network: network's name
                    orderer: configuration of output block
                    raft_option: configuration of raft
                    filepath: cello's working directory
                return:
        """
        self.filepath = filepath
        self.network = network
        self.orderer = {'BatchTimeout': '2s',
                        'OrdererType': "etcdraft",
                        'BatchSize': {'AbsoluteMaxBytes': '98 MB',
                                      'MaxMessageCount': 2000,
                                      'PreferredMaxBytes': '10 MB'}} if not orderer else orderer
        self.raft_option = {'TickInterval': "600ms",
                            'ElectionTick': 10,
                            'HeartbeatTick': 1,
                            'MaxInflightBlocks': 5,
                            'SnapshotIntervalSize': "20 MB"} if not raft_option else raft_option

    def create(self, consensus, orderers, peers, orderer_cfg=None, application=None, option=None):
        """create the cryptotx.yaml
                param:
                    consensus:consensus
                    orderers:the list of orderer
                    peers: the list of peer
                    orderer_cfg: the config of orderer
                    application: application
                    option: option
                return:
        """
        OrdererOrganizations = []
        OrdererAddress = []
        for orderer in orderers:
            OrdererOrganizations.append(dict(Name=orderer["name"].split(".")[0].capitalize() + "Orderer",
                                             ID='{}MSP'.format(orderer["name"].split(".")[0].capitalize()+"Orderer"),
                                             MSPDir='{}/{}/crypto-config/ordererOrganizations/{}/msp'.format(self.filepath,orderer["name"],orderer['name'].split(".", 1)[1]),
                                             Policies=dict(Readers=dict(Type="Signature",Rule="OR('{}MSP.member')".format(orderer["name"].split(".")[0].capitalize()+"Orderer")),
                                                           Writers=dict(Type="Signature",Rule="OR('{}MSP.member')".format(orderer["name"].split(".")[0].capitalize()+"Orderer")),
                                                           Admins=dict(Type="Signature",Rule="OR('{}MSP.admin')".format(orderer["name"].split(".")[0].capitalize()+"Orderer")))
                                             ))
            for host in orderer['hosts']:
                OrdererAddress.append('{}.{}:{}'.format(host['name'], orderer['name'].split(".", 1)[1], 7050))

        PeerOrganizations = []

        for peer in peers:
            PeerOrganizations.append(dict(Name=peer["name"].split(".")[0].capitalize(),
                                          ID='{}MSP'.format(peer["name"].split(".")[0].capitalize()),
                                          MSPDir='{}/{}/crypto-config/peerOrganizations/{}/msp'.format(self.filepath,peer['name'],peer['name']),
                                          #AnchorPeers=[{'Port': peer["hosts"][0]["port"], 'Host': '{}.{}'.format(peer["hosts"][0]["name"],peer["name"])}],
                                          Policies=dict(Readers=dict(Type="Signature",Rule="OR('{}MSP.peer', '{}MSP.admin','{}MSP.client')".format(peer["name"].split(".")[0].capitalize(),peer["name"].split(".")[0].capitalize(),peer["name"].split(".")[0].capitalize())),
                                                        Writers=dict(Type="Signature",Rule="OR('{}MSP.admin','{}MSP.client')".format(peer["name"].split(".")[0].capitalize(),peer["name"].split(".")[0].capitalize())),
                                                        Admins=dict(Type="Signature",Rule="OR('{}MSP.admin')".format(peer["name"].split(".")[0].capitalize())))
                                          ))
        Organizations = OrdererOrganizations + PeerOrganizations

        Orderer = {'BatchTimeout': orderer_cfg['BatchTimeout'] if orderer_cfg else self.orderer['BatchTimeout'],
                       'Organizations': None,
                       'Addresses': OrdererAddress,
                       'OrdererType': consensus if consensus else self.orderer['OrdererType'],
                       'BatchSize': orderer_cfg['BatchSize'] if orderer_cfg else self.orderer['BatchSize']
                       }

        channel = {"Policies": dict(Readers=dict(Type="ImplicitMeta", Rule="ANY Readers"),
                                    Writers=dict(Type="ImplicitMeta", Rule="ANY Writers"),
                                    Admins=dict(Type="ImplicitMeta", Rule="MAJORITY Admins"))
                   }

        capabilities = {"Channel": {"V2_0": True, "V1_3": False},
                        "Orderer": {"V2_0": True, "V1_3": False},
                        "Application": {"V2_0": True, "V1_3": False, "V1_2": False, "V1_1": False},

        }

        if consensus == 'etcdraft':
            Consenters = []
            for orderer in orderers:
                for host in orderer['hosts']:
                    Consenters.append(dict(Host='{}.{}'.format(host['name'], orderer['name'].split(".", 1)[1]),
                                           Port=7050,
                                           ClientTLSCert='{}/{}/crypto-config/ordererOrganizations/{}/orderers/{}.{}/tls/server.crt'
                                           .format(self.filepath, orderer['name'], orderer['name'].split(".", 1)[1],host['name'], orderer['name'].split(".", 1)[1]),
                                           ServerTLSCert='{}/{}/crypto-config/ordererOrganizations/{}/orderers/{}.{}/tls/server.crt'
                                           .format(self.filepath, orderer['name'], orderer['name'].split(".", 1)[1], host['name'], orderer['name'].split(".", 1)[1])))
            Option = option if option else self.raft_option
            Orderer['EtcdRaft'] = dict(Consenters=Consenters,Options=Option)
            Orderer["Policies"] = dict(Readers=dict(Type="ImplicitMeta", Rule="ANY Readers"),
                                       Writers=dict(Type="ImplicitMeta", Rule="ANY Writers"),
                                       Admins=dict(Type="ImplicitMeta", Rule="MAJORITY Admins"),
                                       BlockValidation=dict(Type="ImplicitMeta",Rule="MAJORITY Writers"))
            #Profiles['TwoOrgsOrdererGenesis']['Orderer']['EtcdRaft'] = dict(Consenters=Consenters, Options=Option)

        Application = application if application else {'Organizations': None,
                                                       "Policies": dict(Readers=dict(Type="ImplicitMeta", Rule="ANY Readers"),
                                                                       Writers=dict(Type="ImplicitMeta", Rule="ANY Writers"),
                                                                       Admins=dict(Type="ImplicitMeta", Rule="MAJORITY Admins"))
        }
        Profiles = {'TwoOrgsOrdererGenesis': {
            # 'Orderer': {'BatchTimeout': orderer_cfg['BatchTimeout'] if orderer_cfg else self.orderer['BatchTimeout'],
            #             'Organizations': OrdererOrganizations,
            #             'Addresses': OrdererAddress,
            #             'OrdererType': consensus if consensus else self.orderer['OrdererType'],
            #             'BatchSize': orderer_cfg['BatchSize'] if orderer_cfg else self.orderer['BatchSize']
            #             },
            "Orderer": Orderer,
            'Consortiums': {'SampleConsortium': {'Organizations': PeerOrganizations}},
            "Policies": dict(Readers=dict(Type="ImplicitMeta", Rule="ANY Readers"),
                             Writers=dict(Type="ImplicitMeta", Rule="ANY Writers"),
                             Admins=dict(Type="ImplicitMeta", Rule="MAJORITY Admins"))
        }}

        configtx = dict(Application=Application, Orderer=Orderer, Profiles=Profiles, Organizations=Organizations, Channel=channel, Capabilities=capabilities)
        os.system('mkdir -p {}/{}'.format(self.filepath, self.network))

        with open('{}/{}/configtx.yaml'.format(self.filepath, self.network), 'w', encoding='utf-8') as f:
            yaml.dump(configtx, f)

    def createChannel(self, name, organizations):
        """create the channel.tx
                param:
                  name: name of channel
                  organizations: Organizations ready to join the channel
                return:
        """
        try:
            with open('{}/{}/{}'.format(self.filepath, self.network, "configtx.yaml"), 'r+', encoding='utf-8') as f:
                configtx = yaml.load(f, Loader=yaml.FullLoader)
                Profiles = configtx["Profiles"]
                Policies = configtx["Channel"]["Policies"]
                Application = configtx["Capabilities"]["Application"]
                Capabilities = configtx["Capabilities"]["Channel"]
                PeerOrganizations = []
                for org in configtx["Organizations"]:
                    for item in organizations:
                        if org["ID"] == item.split(".")[0].capitalize()+"MSP":
                            PeerOrganizations.append(org)
                if PeerOrganizations == []:
                    raise Exception("can't find organnization")
                Profiles[name] = {
                    "Consortium": "SampleConsortium",
                    "Policies": Policies,
                    "Capabilities": Capabilities,
                    "Application": {"Policies": configtx["Application"]["Policies"],
                                    "Organizations": PeerOrganizations,
                                    "Capabilities": Application},
                }

            with open('{}/{}/{}'.format(self.filepath, self.network, "configtx.yaml"), 'w', encoding='utf-8') as f:
                yaml.dump(configtx, f)

        except Exception as e:
            err_msg = "Configtx create channel failed for {}!".format(e)
            raise Exception(err_msg)


if __name__ == "__main__":
    #orderers=[{"name":"org1.cello.com","hosts":[{"name": "orderer1", "port":8051}]}]
    #peers = [{"name": "org1.cello.com", "hosts": [{"name": "foo", "port": 7051},{"name": "car", "port": 7052}]},
    #         {"name": "org2.cello.com", "hosts": [{"name": "zoo", "port": 7053}]}]
    #peers = [{"name": "org1.cello.com", "hosts": [{"name": "foo", "port": 7051}, {"name": "car", "port": 7052}]}]
    #ConfigTX("test3").create(consensus="etcdraft", orderers=orderers, peers=peers)
    ConfigTX("net").createChannel("testchannel", ["XqMSP"])
