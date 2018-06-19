'use strict';

const hfc = require('fabric-client');
const copService = require('fabric-ca-client');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');

module.exports = app => {
  function getKeyStoreForOrg(keyValueStore, org) {
    return keyValueStore + '/' + org;
  }
  function newOrderer(network, client) {
    const caRootsPath = network.orderer.tls_cacerts;
    const data = fs.readFileSync(caRootsPath);
    const caroots = Buffer.from(data).toString();
    return client.newOrderer(network.orderer.url, {
      pem: caroots,
      'ssl-target-name-override': network.orderer['server-hostname'],
    });
  }
  function setupPeers(network, channel, org, client) {
    for (const key in network[org].peers) {
      const data = fs.readFileSync(network[org].peers[key].tls_cacerts);
      const peer = client.newPeer(
        network[org].peers[key].requests,
        {
          pem: Buffer.from(data).toString(),
          'ssl-target-name-override': network[org].peers[key]['server-hostname'],
        }
      );
      peer.setName(key);

      channel.addPeer(peer);
    }
  }
  async function newRemotes(network, names, forPeers, userOrg, clients) {
    const client = await getClientForOrg(userOrg, clients);

    const targets = [];
    // find the peer that match the names
    for (const idx in names) {
      const peerName = names[idx];
      app.logger.debug('peer Name ', peerName);
      if (network[userOrg].peers[peerName]) {
        // found a peer matching the name
        app.logger.debug(userOrg, peerName, network[userOrg].peers[peerName]);
        const data = fs.readFileSync(network[userOrg].peers[peerName].tls_cacerts);
        const grpcOpts = {
          pem: Buffer.from(data).toString(),
          'ssl-target-name-override': network[userOrg].peers[peerName]['server-hostname'],
        };

        if (forPeers) {
          targets.push(client.newPeer(network[userOrg].peers[peerName].requests, grpcOpts));
        } else {
          const eh = await client.newEventHub();
          eh.setPeerAddr(network[userOrg].peers[peerName].events, grpcOpts);
          targets.push(eh);
        }
      }
    }

    if (targets.length === 0) {
      app.logger.error('Failed to find peers matching the names %s', names);
    }

    return targets;
  }
  async function newPeers(network, names, org, clients) {
    return await newRemotes(network, names, true, org, clients);
  }

  async function newEventHubs(network, names, org, clients) {
    return await newRemotes(network, names, false, org, clients);
  }
  async function getClientForOrg(org, clients) {
    return clients[org];
  }
  async function getChannelForOrg(org, channels) {
    return channels[org];
  }
  function getOrgName(org, network) {
    return network[org].name;
  }
  function getMspID(org, network) {
    app.logger.debug('Msp ID : ' + network[org].mspid);
    return network[org].mspid;
  }
  function readAllFiles(dir) {
    const files = fs.readdirSync(dir);
    const certs = [];
    files.forEach(file_name => {
      const data = fs.readFileSync(path.join(dir, file_name));
      certs.push(data);
    });
    return certs;
  }
  async function getOrgAdmin(userOrg, helper) {
    const { network, clients, keyValueStore } = helper;
    const admin = network[userOrg].admin;
    const keyPEM = Buffer.from(readAllFiles(admin.key)[0]).toString();
    const certPEM = readAllFiles(admin.cert)[0].toString();

    const client = await getClientForOrg(userOrg, clients);
    const cryptoSuite = hfc.newCryptoSuite();
    if (userOrg) {
      cryptoSuite.setCryptoKeyStore(hfc.newCryptoKeyStore({ path: getKeyStoreForOrg(keyValueStore, getOrgName(userOrg, network)) }));
      client.setCryptoSuite(cryptoSuite);
    }

    const store = await hfc.newDefaultKeyValueStore({
      path: getKeyStoreForOrg(keyValueStore, getOrgName(userOrg, network)),
    });
    app.logger.debug('store ', store);
    client.setStateStore(store);
    const user = client.createUser({
      username: 'peer' + userOrg + 'Admin',
      mspid: getMspID(userOrg, network),
      cryptoContent: {
        privateKeyPEM: keyPEM,
        signedCertPEM: certPEM,
      },
    });
    return user;
  }
  async function createChannel(network, keyValueStorePath, channelName, channelConfigPath) {
    const helper = await fabricHelper(network, keyValueStorePath);
    const client = await getClientForOrg('org1', helper.clients);
    const channel = await getChannelForOrg('org1', helper.channels);
    const envelope = fs.readFileSync(`${channelConfigPath}/${channelName}.tx`);
    const channelConfig = client.extractChannelConfig(envelope);
    await getOrgAdmin('org1', helper);
    const signature = client.signChannelConfig(channelConfig);

    const request = {
      config: channelConfig,
      signatures: [signature],
      name: channelName,
      orderer: channel.getOrderers()[0],
      txId: client.newTransactionID(),
    };
    try {
      const response = await client.createChannel(request);
      app.logger.debug('response ', response);
    } catch (e) {
      app.logger.error(e.message);
    }
  }
  async function joinChannelPromise(eventhubs, channelName, org, helper, request) {
    const eventPromises = [];
    const channel = await getChannelForOrg(org, helper.channels);
    eventhubs.forEach(eh => {
      const txPromise = new Promise((resolve, reject) => {
        const handle = setTimeout(reject, 30000);
        eh.registerBlockEvent(block => {
          clearTimeout(handle);
          // in real-world situations, a peer may have more than one channels so
          // we must check that this block came from the channel we asked the peer to join
          if (block.data.data.length === 1) {
            // Config block must only contain one transaction
            const channel_header = block.data.data[0].payload.header.channel_header;
            if (channel_header.channel_id === channelName) {
              resolve();
            } else {
              reject();
            }
          }
        });
      });
      eventPromises.push(txPromise);
    });
    const sendPromise = channel.joinChannel(request);
    return Promise.all([sendPromise].concat(eventPromises));
  }
  async function joinChannel(network, keyValueStorePath, channelName, peers, org) {
    const helper = await fabricHelper(network, keyValueStorePath);
    const client = await getClientForOrg('org1', helper.clients);
    const channel = await getChannelForOrg('org1', helper.channels);

    await getOrgAdmin('org1', helper);
    let txId = await client.newTransactionID();
    let request = {
      txId,
    };
    const allEventhubs = [];
    const closeConnections = async function(isSuccess) {
      if (isSuccess) {
        app.logger.debug('\n============ Join Channel is SUCCESS ============\n');
      } else {
        app.logger.debug('\n!!!!!!!! ERROR: Join Channel FAILED !!!!!!!!\n');
      }
      for (const key in allEventhubs) {
        const eventhub = allEventhubs[key];
        if (eventhub && eventhub.isconnected()) {
          await eventhub.disconnect();
        }
      }
    };

    const genesisBlock = await channel.getGenesisBlock(request);
    txId = await client.newTransactionID();
    request = {
      targets: await newPeers(network, peers, org, helper.clients),
      txId,
      block: genesisBlock,
    };

    const eventhubs = await newEventHubs(network, peers, org, helper.clients);
    for (const key in eventhubs) {
      const eh = eventhubs[key];
      eh.connect();
      allEventhubs.push(eh);
    }
    const results = await joinChannelPromise(eventhubs, channelName, org, helper, request);
    app.logger.debug('Join Channel R E S P O N S E : %j', results);
    if (results[0] && results[0][0] && results[0][0].response && results[0][0]
      .response.status === 200) {
      app.logger.info(
        'Successfully joined peers in organization %s to the channel \'%s\'',
        org, channelName);
      await closeConnections(true);
      return {
        success: true,
        message: util.format(
          'Successfully joined peers in organization %s to the channel \'%s\'',
          org, channelName),
      };
    }
    await closeConnections(false);
    return {
      success: false,
    };

  }
  async function fabricHelper(network, keyValueStore) {
    const helper = {
      network,
      keyValueStore,
    };
    const clients = {};
    const channels = {};
    const caClients = {};
    for (const key in network) {
      if (key.indexOf('org') === 0) {
        const client = new hfc();
        const cryptoSuite = hfc.newCryptoSuite();
        cryptoSuite.setCryptoKeyStore(hfc.newCryptoKeyStore({ path: getKeyStoreForOrg(keyValueStore, network[key].name) }));
        client.setCryptoSuite(cryptoSuite);

        const channel = client.newChannel('mychannel');
        channel.addOrderer(newOrderer(network, client));

        clients[key] = client;
        channels[key] = channel;

        setupPeers(network, channel, key, client);

        const caUrl = network[key].ca;
        caClients[key] = new copService(caUrl, null, cryptoSuite);
      }
    }
    helper.clients = clients;
    helper.channels = channels;
    helper.caClients = caClients;
    return helper;
  }
  async function sleep(sleep_time_ms) {
    return new Promise(resolve => setTimeout(resolve, sleep_time_ms));
  }
  app.fabricHelper = fabricHelper;
  app.getClientForOrg = getClientForOrg;
  app.getOrgAdmin = getOrgAdmin;
  app.getChannelForOrg = getChannelForOrg;
  app.createChannel = createChannel;
  app.joinChannel = joinChannel;
  app.sleep = sleep;
  hfc.setLogger(app.logger);
};
