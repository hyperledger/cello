/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Parse = require('parse/node');

async function generateNetworkFabricV1_0(chain, networkConfig) {
  const orgConfigQuery = new Parse.Query('OrgConfig');
  orgConfigQuery.equalTo('networkConfig', networkConfig);
  orgConfigQuery.ascending('sequence');
  const orgConfigs = await orgConfigQuery.find();

  const ordererConfigQuery = new Parse.Query('OrdererConfig');
  ordererConfigQuery.equalTo('networkConfig', networkConfig);
  const ordererConfig = await ordererConfigQuery.first();

  const network = {
    orderer: {
      url: `grpcs://${ordererConfig.get('url')}`,
      'server-hostname': ordererConfig.get('serverHostName'),
      tls_cacerts: '/var/www/app/lib/fabric/fixtures/channel/v1.0/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt',
    },
  };

  for (const index in orgConfigs) {
    const orgConfig = orgConfigs[index];
    const caConfigQuery = new Parse.Query('CaConfig');
    caConfigQuery.equalTo('networkConfig', networkConfig);
    caConfigQuery.equalTo('sequence', orgConfig.get('sequence'));
    const caConfig = await caConfigQuery.first();

    const peerConfigQuery = new Parse.Query('PeerConfig');
    peerConfigQuery.equalTo('networkConfig', networkConfig);
    peerConfigQuery.equalTo('orgConfig', orgConfig);
    peerConfigQuery.ascending('sequence');
    const peerConfigs = await peerConfigQuery.find();
    const peers = {};
    for (const peerIndex in peerConfigs) {
      const peerConfig = peerConfigs[peerIndex];
      peers[`peer${peerConfig.get('sequence') + 1}`] = {
        requests: `grpcs://${peerConfig.get('grpc')}`,
        events: `grpcs://${peerConfig.get('event')}`,
        'server-hostname': `peer${peerConfig.get('sequence')}.org${orgConfig.get('sequence')}.example.com`,
        tls_cacerts: `/var/www/app/lib/fabric/fixtures/channel/v1.0/crypto-config/peerOrganizations/org${orgConfig.get('sequence')}.example.com/peers/peer${peerConfig.get('sequence')}.org${orgConfig.get('sequence')}.example.com/tls/ca.crt`,
      };
    }
    network[`org${orgConfig.get('sequence')}`] = {
      name: orgConfig.get('name'),
      mspid: orgConfig.get('mspid'),
      ca: `https://${caConfig.get('address')}`,
      peers,
      admin: {
        key: `/var/www/app/lib/fabric/fixtures/channel/v1.0/crypto-config/peerOrganizations/org${orgConfig.get('sequence')}.example.com/users/Admin@org${orgConfig.get('sequence')}.example.com/msp/keystore`,
        cert: `/var/www/app/lib/fabric/fixtures/channel/v1.0/crypto-config/peerOrganizations/org${orgConfig.get('sequence')}.example.com/users/Admin@org${orgConfig.get('sequence')}.example.com/msp/signcerts`,
      },
    };
  }

  return network;
}

async function generateNetworkFabricV1_2(chain, networkConfig, config) {
  const { dataDir, defaultChannelName } = config;
  const orgConfigQuery = new Parse.Query('OrgConfig');
  orgConfigQuery.equalTo('networkConfig', networkConfig);
  orgConfigQuery.ascending('sequence');
  const orgConfigs = await orgConfigQuery.find();
  const orgConfigCount = await orgConfigQuery.count();

  const ordererConfigQuery = new Parse.Query('OrdererConfig');
  ordererConfigQuery.equalTo('networkConfig', networkConfig);
  const ordererConfig = await ordererConfigQuery.first();

  const chainRootDir = `${dataDir}/${chain.get('user')}/chains/${chain.id}`;
  const keyValueStorePath = `${chainRootDir}/client-kvs`;
  const orderers = {};
  const certificateAuthorities = {};
  const channels = {
    orderers: [
      'orderer.example.com',
    ],
  };
  const peers = {};
  const organizations = {};
  orderers[ordererConfig.get('serverHostName')] = {
    grpcOptions: {
      'ssl-target-name-override': ordererConfig.get('serverHostName'),
    },
    tlsCACerts: {
      path: '/var/www/app/lib/fabric/fixtures/channel/v1.2/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt',
    },
    url: `grpcs://${ordererConfig.get('url')}`,
  };
  const channelsPeers = {};
  let network = {};
  for (let index = 0; index < orgConfigCount; index++) {
    const orgConfig = orgConfigs[index];

    const caConfigQuery = new Parse.Query('CaConfig');
    caConfigQuery.equalTo('networkConfig', networkConfig);
    caConfigQuery.equalTo('sequence', orgConfig.get('sequence'));
    const caConfig = await caConfigQuery.first();

    const peerConfigQuery = new Parse.Query('PeerConfig');
    peerConfigQuery.equalTo('networkConfig', networkConfig);
    peerConfigQuery.equalTo('orgConfig', orgConfig);
    peerConfigQuery.ascending('sequence');
    const peerConfigs = await peerConfigQuery.find();
    const peerConfigCount = await peerConfigQuery.count();

    const peerNames = [];
    for (let peerIndex = 0; peerIndex < peerConfigCount; peerIndex++) {
      peerNames.push(`peer${peerIndex}.org${index + 1}.example.com`);
      peers[`peer${peerIndex}.org${index + 1}.example.com`] = {
        eventUrl: `grpcs://${peerConfigs[peerIndex].get('event')}`,
        grpcOptions: {
          'ssl-target-name-override': `peer${peerIndex}.org${index + 1}.example.com`,
        },
        tlsCACerts: {
          path: `/var/www/app/lib/fabric/fixtures/channel/v1.2/crypto-config/peerOrganizations/org${index + 1}.example.com/peers/peer${peerIndex}.org${index + 1}.example.com/tls/ca.crt`,
        },
        url: `grpcs://${peerConfigs[peerIndex].get('grpc')}`,
      };
      channelsPeers[`peer${peerIndex}.org${index + 1}.example.com`] = {
        chaincodeQuery: true,
        endorsingPeer: peerIndex === 0,
        eventSource: peerIndex === 0,
        ledgerQuery: true,
      };
    }
    organizations[`org${index + 1}`] = {
      adminPrivateKey: {
        path: `/var/www/app/lib/fabric/fixtures/channel/v1.2/crypto-config/peerOrganizations/org${index + 1}.example.com/users/Admin@org${index + 1}.example.com/msp/keystore/admin_sk`,
      },
      certificateAuthorities: [`ca-org${index + 1}`],
      mspid: `Org${index + 1}MSP`,
      peers: peerNames,
      signedCert: {
        path: `/var/www/app/lib/fabric/fixtures/channel/v1.2/crypto-config/peerOrganizations/org${index + 1}.example.com/users/Admin@org${index + 1}.example.com/msp/signcerts/Admin@org${index + 1}.example.com-cert.pem`,
      },
    };
    certificateAuthorities[`ca-org${index + 1}`] = {
      caName: `ca-org${index + 1}`,
      httpOptions: {
        verify: false,
      },
      registrar: [
        {
          enrollId: 'admin',
          enrollSecret: 'adminpw',
        },
      ],
      tlsCACerts: {
        path: `/var/www/app/lib/fabric/fixtures/channel/v1.2/crypto-config/peerOrganizations/org${index + 1}.example.com/ca/ca.org${index + 1}.example.com-cert.pem`,
      },
      url: `https://${caConfig.get('address')}`,
    };
    network[`org${index + 1}`] = {
      'x-type': 'hlfv1',
      name: `${chain.get('name')}-org${index + 1}`,
      description: `org${index + 1}`,
      version: '1.0',
      client: {
        organization: `org${index + 1}`,
        credentialStore: {
          path: keyValueStorePath,
          cryptoStore: {
            path: `${keyValueStorePath}/tmp`,
          },
          wallet: 'wallet',
        },
      },
    };
  }
  channels.peers = channelsPeers;
  const channelsConfig = {};
  channelsConfig[`${defaultChannelName}`] = channels;
  network = Object.assign(network, {
    config: {
      version: '1.0',
      'x-type': 'hlfv1',
      name: `${chain.get('name')}`,
      description: `${chain.get('name')}`,
      orderers,
      certificateAuthorities,
      organizations,
      peers,
      channels: channelsConfig,
    },
  });
  return network;
}

Parse.Cloud.define("generateNetwork", async function (request) {
  const { id, config } = request.params;
  let network = {};
  try {
    const chainQuery = new Parse.Query('Chain');
    const chain = await chainQuery.get(id);
    const networkNetworkQuery = new Parse.Query('NetworkConfig');
    networkNetworkQuery.equalTo('chain', chain);
    const networkConfig = await networkNetworkQuery.first();
    switch (chain.get('type')) {
      case 'fabric-1.0':
        network = await generateNetworkFabricV1_0(chain, networkConfig);
        break;
      case 'fabric-1.2':
        network = await generateNetworkFabricV1_2(chain, networkConfig, config);
        break;
      default:
        break;
    }
  } catch (e) {
    console.log('generate network failed ', e.message);
  }

  return network;
});
