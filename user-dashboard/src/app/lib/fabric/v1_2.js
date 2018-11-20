'use strict';

const hfc = require('/packages/fabric-1.2/node_modules/fabric-client');
const copService = require('/packages/fabric-1.2/node_modules/fabric-ca-client');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const moment = require('moment');

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
  async function getClientForOrg(org, network, username) {
    const client = hfc.loadFromConfig(network.config);
    client.loadFromConfig(network[org]);

    await client.initCredentialStores();
    if (username) {
      const user = await client.getUserContext(username, true);
      if (!user) {
        throw new Error(util.format('User was not found :', username));
      } else {
        app.logger.debug('User %s was found to be registered and enrolled', username);
      }
    }
    app.logger.debug('getClientForOrg - ****** END %s %s \n\n', org, username);

    return client;
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
  async function createChannel(network, keyValueStorePath, channelName, channelConfigPath, orgName = 'org1') {
    try {
      const client = await getClientForOrg(orgName, network);
      app.logger.debug('Successfully got the fabric client for the organization ', orgName);
      const envelope = fs.readFileSync(`${channelConfigPath}/${channelName}.tx`);
      app.logger.debug('tx path', `${channelConfigPath}/${channelName}.tx`);
      // await getRegisteredUser(network, username, orgName, true);
      const channelConfig = client.extractChannelConfig(envelope);
      const signature = client.signChannelConfig(channelConfig);

      const request = {
        config: channelConfig,
        signatures: [signature],
        name: channelName,
        txId: client.newTransactionID(true), // get an admin based transactionID
      };
      const response = await client.createChannel(request);
      app.logger.debug(' response ::%j', response);
      if (response && response.status === 'SUCCESS') {
        app.logger.debug('Successfully created the channel.');
        const response = {
          success: true,
          message: 'Channel \'' + channelName + '\' created Successfully',
        };
        return response;
      }
      app.logger.error('\n!!!!!!!!! Failed to create the channel \'' + channelName +
          '\' !!!!!!!!!\n\n');
      throw new Error('Failed to create the channel \'' + channelName + '\'');

    } catch (err) {
      app.logger.error('Failed to initialize the channel: ' + err.stack ? err.stack :	err);
      throw new Error('Failed to initialize the channel: ' + err.toString());
    }
  }
  async function joinChannel(network, keyValueStorePath, channelName, peers, org, username = '') {
    app.logger.debug('\n\n============ Join Channel start ============\n');
    let error_message = null;
    const all_eventhubs = [];
    try {
      app.logger.info('Calling peers in organization "%s" to join the channel', org);

      // first setup the client for this org
      const client = await getClientForOrg(org, network, username);
      app.logger.debug('Successfully got the fabric client for the organization "%s"', org);
      const channel = client.getChannel(channelName);
      if (!channel) {
        const message = util.format('Channel %s was not defined in the connection profile', channelName);
        app.logger.error(message);
        throw new Error(message);
      }
      const request = {
        txId: client.newTransactionID(true), // get an admin based transactionID
      };
      const genesis_block = await channel.getGenesisBlock(request);
      const promises = [];
      const block_registration_numbers = [];
      const event_hubs = client.getEventHubsForOrg(org);
      event_hubs.forEach(eh => {
        const configBlockPromise = new Promise((resolve, reject) => {
          const event_timeout = setTimeout(() => {
            const message = 'REQUEST_TIMEOUT:' + eh._ep._endpoint.addr;
            app.logger.error(message);
            eh.disconnect();
            reject(new Error(message));
          }, 60000);
          const block_registration_number = eh.registerBlockEvent(block => {
            clearTimeout(event_timeout);
            // a peer may have more than one channel so
            // we must check that this block came from the channel we
            // asked the peer to join
            if (block.data.data.length === 1) {
              // Config block must only contain one transaction
              const channel_header = block.data.data[0].payload.header.channel_header;
              if (channel_header.channel_id === channelName) {
                const message = util.format('EventHub % has reported a block update for channel %s', eh._ep._endpoint.addr, channelName);
                app.logger.info(message);
                resolve(message);
              } else {
                const message = util.format('Unknown channel block event received from %s', eh._ep._endpoint.addr);
                app.logger.error(message);
                reject(new Error(message));
              }
            }
          }, err => {
            clearTimeout(event_timeout);
            const message = 'Problem setting up the event hub :' + err.toString();
            app.logger.error(message);
            reject(new Error(message));
          });
          // save the registration handle so able to deregister
          block_registration_numbers.push(block_registration_number);
          all_eventhubs.push(eh); // save for later so that we can shut it down
        });
        promises.push(configBlockPromise);
        eh.connect(); // this opens the event stream that must be shutdown at some point with a disconnect()
      });
      const join_request = {
        targets: peers, // using the peer names which only is allowed when a connection profile is loaded
        txId: client.newTransactionID(true), // get an admin based transactionID
        block: genesis_block,
      };
      const join_promise = channel.joinChannel(join_request);
      promises.push(join_promise);
      const results = await Promise.all(promises);
      app.logger.debug(util.format('Join Channel R E S P O N S E : %j', results));
      const peers_results = results.pop();
      // then each peer results
      for (const i in peers_results) {
        const peer_result = peers_results[i];
        if (peer_result.response && peer_result.response.status === 200) {
          app.logger.info('Successfully joined peer to the channel %s', channelName);
        } else {
          const message = util.format('Failed to joined peer to the channel %s', channelName);
          error_message = message;
          app.logger.error(message);
        }
      }
      // now see what each of the event hubs reported
      for (const i in results) {
        const event_hub_result = results[i];
        const event_hub = event_hubs[i];
        const block_registration_number = block_registration_numbers[i];
        app.logger.debug('Event results for event hub :%s', event_hub._ep._endpoint.addr);
        if (typeof event_hub_result === 'string') {
          app.logger.debug(event_hub_result);
        } else {
          if (!error_message) error_message = event_hub_result.toString();
          app.logger.debug(event_hub_result.toString());
        }
        event_hub.unregisterBlockEvent(block_registration_number);
      }
    } catch (error) {
      app.logger.error('Failed to join channel due to error: ' + error.stack ? error.stack : error);
      error_message = error.toString();
    }

    all_eventhubs.forEach(eh => {
      eh.disconnect();
    });

    if (!error_message) {
      const message = util.format(
        'Successfully joined peers in organization %s to the channel:%s',
        org, channelName);
      app.logger.info(message);
      // build a response to send back to the REST caller
      const response = {
        success: true,
        message,
      };
      return response;
    }
    const message = util.format('Failed to join all peers to channel. cause:%s', error_message);
    app.logger.error(message);
    throw new Error(message);

  }
  async function installSmartContract(network, keyValueStorePath, peers, userId, smartContractCodeId, chainId, org, username = '', chainCodeType = 'golang') {
    const ctx = app.createAnonymousContext();
    // let tx_id = null;
    app.logger.debug('\n\n============ Install chain code on organizations ============\n');
    const smartContractCode = await ctx.model.SmartContractCode.findOne({ _id: smartContractCodeId });
    const chain = await ctx.model.Chain.findOne({ _id: chainId });
    const chainCodeName = `${chain.chainId}-${smartContractCodeId}`;
    const smartContractSourcePath = `github.com/${smartContractCodeId}`;
    const chainRootPath = `/opt/data/${userId}/chains/${chainId}`;
    process.env.GOPATH = chainRootPath;
    fs.ensureDirSync(`${chainRootPath}/src/github.com`);
    fs.copySync(smartContractCode.path, `${chainRootPath}/src/${smartContractSourcePath}`);
    let error_message = null;
    try {
      app.logger.info('Calling peers in organization "%s" to join the channel', org);

      // first setup the client for this org
      const client = await getClientForOrg(org, network, username);
      app.logger.debug('Successfully got the fabric client for the organization "%s"', org);

      // tx_id = client.newTransactionID(true); // get an admin transactionID
      client.newTransactionID(true); // get an admin transactionID
      const request = {
        targets: peers,
        chaincodeType: chainCodeType,
        chaincodePath: smartContractSourcePath,
        chaincodeId: chainCodeName,
        chaincodeVersion: smartContractCode.version,
      };
      const results = await client.installChaincode(request);
      // the returned object has both the endorsement results
      // and the actual proposal, the proposal will be needed
      // later when we send a transaction to the orederer
      const proposalResponses = results[0];
      // const proposal = results[1];

      // lets have a look at the responses to see if they are
      // all good, if good they will also include signatures
      // required to be committed
      let all_good = true;
      for (const i in proposalResponses) {
        let one_good = false;
        if (proposalResponses && proposalResponses[i].response &&
          proposalResponses[i].response.status === 200) {
          one_good = true;
          app.logger.info('install proposal was good');
        } else {
          app.logger.error('install proposal was bad %j', proposalResponses.toJSON());
        }
        all_good = all_good & one_good;
      }
      if (all_good) {
        app.logger.info('Successfully sent install Proposal and received ProposalResponse');
      } else {
        error_message = 'Failed to send install Proposal or receive valid response. Response null or status is not 200';
        app.logger.error(error_message);
      }
    } catch (error) {
      app.logger.error('Failed to install due to error: ' + error.stack ? error.stack : error);
      error_message = error.toString();
    }

    if (!error_message) {
      const message = util.format('Successfully install chaincode');
      app.logger.info(message);
      // build a response to send back to the REST caller
      const deploy = await ctx.model.SmartContractDeploy.findOneAndUpdate({
        smartContractCode,
        smartContract: smartContractCode.smartContract,
        name: chainCodeName,
        chain: chainId,
        // user: userId,
      }, {
        status: 'installed',
      }, { upsert: true, new: true });
      await ctx.model.Operation.create({
        smartContractCode,
        smartContract: smartContractCode.smartContract,
        chain: chainId,
        user: userId,
        operate: app.config.operations.InstallCode.key,
      });
      return {
        success: true,
        deployId: deploy._id.toString(),
        message: 'Successfully Installed chaincode on organization ' + org,
      };
    }
    const message = util.format('Failed to install due to:%s', error_message);
    app.logger.error(message);
    return {
      success: false,
      message,
    };

  }
  async function instantiateSmartContract(network, keyValueStorePath, channelName, deployId, functionName, args, org, peers, username = '', chainCodeType = 'golang') {
    const ctx = app.createAnonymousContext();
    app.logger.debug('\n\n============ Instantiate chaincode on channel ' + channelName +
      ' ============\n');
    let error_message = null;
    const deploy = await ctx.model.SmartContractDeploy.findOne({ _id: deployId }).populate('smartContractCode smartContract chain');
    deploy.status = 'instantiating';
    deploy.save();

    try {
      // first setup the client for this org
      const client = await getClientForOrg(org, network, username);
      app.logger.debug('Successfully got the fabric client for the organization "%s"', org);
      const channel = client.getChannel(channelName);
      if (!channel) {
        const message = util.format('Channel %s was not defined in the connection profile', channelName);
        app.logger.error(message);
        throw new Error(message);
      }
      const tx_id = client.newTransactionID(true); // Get an admin based transactionID
      const deployId = await tx_id.getTransactionID();
      // An admin based transactionID will
      // indicate that admin identity should
      // be used to sign the proposal request.
      // will need the transaction ID string for the event registration later
      // let deployId = tx_id.getTransactionID();

      // send proposal to endorser
      const request = {
        targets: peers,
        chaincodeType: chainCodeType,
        chaincodeId: deploy.name,
        chaincodeVersion: deploy.smartContractCode.version,
        args,
        txId: tx_id,
      };

      if (functionName) { request.fcn = functionName; }

      const results = await channel.sendInstantiateProposal(request, 60000); // instantiate takes much longer

      // the returned object has both the endorsement results
      // and the actual proposal, the proposal will be needed
      // later when we send a transaction to the orderer
      const proposalResponses = results[0];
      const proposal = results[1];

      // lets have a look at the responses to see if they are
      // all good, if good they will also include signatures
      // required to be committed
      let all_good = true;
      for (const i in proposalResponses) {
        let one_good = false;
        if (proposalResponses && proposalResponses[i].response &&
          proposalResponses[i].response.status === 200) {
          one_good = true;
          app.logger.info('instantiate proposal was good');
        } else {
          app.logger.error('instantiate proposal was bad');
        }
        all_good = all_good & one_good;
      }

      if (all_good) {
        app.logger.info(util.format(
          'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s',
          proposalResponses[0].response.status, proposalResponses[0].response.message,
          proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature));

        // wait for the channel-based event hub to tell us that the
        // instantiate transaction was committed on the peer
        const promises = [];
        const event_hubs = channel.getChannelEventHubsForOrg();
        app.logger.debug('found %s eventhubs for this organization %s', event_hubs.length, org);
        event_hubs.forEach(eh => {
          const instantiateEventPromise = new Promise((resolve, reject) => {
            app.logger.debug('instantiateEventPromise - setting up event');
            const event_timeout = setTimeout(() => {
              const message = 'REQUEST_TIMEOUT:' + eh.getPeerAddr();
              app.logger.error(message);
              eh.disconnect();
            }, 60000);
            eh.registerTxEvent(deployId, (tx, code, block_num) => {
              app.logger.info('The chaincode instantiate transaction has been committed on peer %s', eh.getPeerAddr());
              app.logger.info('Transaction %s has status of %s in blocl %s', tx, code, block_num);
              clearTimeout(event_timeout);

              if (code !== 'VALID') {
                const message = util.format('The chaincode instantiate transaction was invalid, code:%s', code);
                app.logger.error(message);
                reject(new Error(message));
              } else {
                const message = 'The chaincode instantiate transaction was valid.';
                app.logger.info(message);
                resolve(message);
              }
            }, err => {
              clearTimeout(event_timeout);
              app.logger.error(err);
              reject(err);
            },
              // the default for 'unregister' is true for transaction listeners
              // so no real need to set here, however for 'disconnect'
              // the default is false as most event hubs are long running
              // in this use case we are using it only once
            { unregister: true, disconnect: true }
            );
            eh.connect();
          });
          promises.push(instantiateEventPromise);
        });

        const orderer_request = {
          txId: tx_id, // must include the transaction id so that the outbound
          // transaction to the orderer will be signed by the admin
          // id as was the proposal above, notice that transactionID
          // generated above was based on the admin id not the current
          // user assigned to the 'client' instance.
          proposalResponses,
          proposal,
        };
        const sendPromise = channel.sendTransaction(orderer_request);
        // put the send to the orderer last so that the events get registered and
        // are ready for the orderering and committing
        promises.push(sendPromise);
        const results = await Promise.all(promises);
        app.logger.debug(util.format('------->>> R E S P O N S E : %j', results));
        const response = results.pop(); //  orderer results are last in the results
        if (response.status === 'SUCCESS') {
          app.logger.info('Successfully sent transaction to the orderer.');
        } else {
          error_message = util.format('Failed to order the transaction. Error code: %s', response.status);
          app.logger.debug(error_message);
        }

        // now see what each of the event hubs reported
        for (const i in results) {
          const event_hub_result = results[i];
          const event_hub = event_hubs[i];
          app.logger.debug('Event results for event hub :%s', event_hub.getPeerAddr());
          if (typeof event_hub_result === 'string') {
            app.logger.debug(event_hub_result);
          } else {
            if (!error_message) error_message = event_hub_result.toString();
            app.logger.debug(event_hub_result.toString());
          }
        }
      } else {
        error_message = util.format('Failed to send Proposal and receive all good ProposalResponse');
        app.logger.debug(error_message);
      }
    } catch (error) {
      app.logger.error('Failed to send instantiate due to error: ' + error.stack ? error.stack : error);
      error_message = error.toString();
    }

    if (!error_message) {
      const message = util.format(
        'Successfully instantiate chaingcode in organization %s to the channel \'%s\'',
        org, channelName);
      app.logger.info(message);
      await ctx.model.Operation.create({
        smartContractCode: deploy.smartContractCode,
        smartContract: deploy.smartContract,
        chain: deploy.chain,
        user: deploy.user,
        operate: app.config.operations.InstantiateCode.key,
      });
      deploy.status = 'instantiated';
      deploy.deployTime = Date.now();
      deploy.save();
      return {
        success: true,
      };
    }
    const message = util.format('Failed to instantiate. cause:%s', error_message);
    await ctx.model.Operation.create({
      smartContractCode: deploy.smartContractCode,
      smartContract: deploy.smartContract,
      chain: deploy.chain,
      user: deploy.user,
      success: false,
      error: message,
      operate: app.config.operations.InstantiateCode.key,
    });
    app.logger.error(message);
    return {
      success: false,
      error: message,
    };
    // throw new Error(message);

  }
  async function getRegisteredUser(network, username, userOrg, isJson) {
    const { config } = app;
    try {
      const client = await getClientForOrg(userOrg, network);
      app.logger.debug('Successfully initialized the credential stores');
      // client can now act as an agent for organization Org1
      // first check to see if the user is already enrolled
      let user = await client.getUserContext(username, true);
      if (user && user.isEnrolled()) {
        app.logger.info('Successfully loaded member from persistence');
      } else {
        // user was not enrolled, so we will need an admin user object to register
        app.logger.info('User %s was not enrolled, so we will need an admin user object to register', username);
        const admins = config.default.admins;
        const adminUserObj = await client.setUserContext({ username: admins[0].username, password: admins[0].secret });
        const caClient = client.getCertificateAuthority();
        const secret = await caClient.register({
          enrollmentID: username,
          // affiliation: userOrg.toLowerCase() + '.department1'
          affiliation: userOrg.toLowerCase(),
        }, adminUserObj);
        app.logger.debug('Successfully got the secret for user %s', username);
        user = await client.setUserContext({ username, password: secret });
        app.logger.debug('Successfully enrolled username %s  and setUserContext on the client object', username);
      }
      if (user && user.isEnrolled) {
        if (isJson && isJson === true) {
          return {
            success: true,
            secret: user._enrollmentSecret,
            message: username + ' enrolled Successfully',
          };
        }
      } else {
        throw new Error('User was not enrolled ');
      }
    } catch (error) {
      app.logger.error('Failed to get registered user: %s with error: %s', username, error.toString());
      return 'failed ' + error.toString();
    }
  }
  async function invokeChainCode(network, keyValueStorePath, peerNames, channelName, chainCodeName, fcn, args, username, org) {
    app.logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));
    let error_message = null;
    let tx_id_string = null;
    try {
      // first setup the client for this org
      const client = await getClientForOrg(org, network, username);
      app.logger.debug('Successfully got the fabric client for the organization "%s"', org);
      const channel = client.getChannel(channelName);
      if (!channel) {
        const message = util.format('Channel %s was not defined in the connection profile', channelName);
        app.logger.error(message);
        throw new Error(message);
      }
      const tx_id = client.newTransactionID();
      // will need the transaction ID string for the event registration later
      tx_id_string = tx_id.getTransactionID();

      // send proposal to endorser
      const request = {
        targets: peerNames,
        chaincodeId: chainCodeName,
        fcn,
        args,
        chainId: channelName,
        txId: tx_id,
      };

      const results = await channel.sendTransactionProposal(request);

      // the returned object has both the endorsement results
      // and the actual proposal, the proposal will be needed
      // later when we send a transaction to the orderer
      const proposalResponses = results[0];
      const proposal = results[1];

      // lets have a look at the responses to see if they are
      // all good, if good they will also include signatures
      // required to be committed
      let all_good = true;
      for (const i in proposalResponses) {
        let one_good = false;
        if (proposalResponses && proposalResponses[i].response &&
          proposalResponses[i].response.status === 200) {
          one_good = true;
          app.logger.info('invoke chaincode proposal was good');
        } else {
          app.logger.error('invoke chaincode proposal was bad');
        }
        all_good = all_good & one_good;
      }

      if (all_good) {
        app.logger.info(util.format(
          'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s',
          proposalResponses[0].response.status, proposalResponses[0].response.message,
          proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature));

        // wait for the channel-based event hub to tell us
        // that the commit was good or bad on each peer in our organization
        const promises = [];
        const event_hubs = channel.getChannelEventHubsForOrg();
        event_hubs.forEach(eh => {
          app.logger.debug('invokeEventPromise - setting up event');
          const invokeEventPromise = new Promise((resolve, reject) => {
            const event_timeout = setTimeout(() => {
              const message = 'REQUEST_TIMEOUT:' + eh.getPeerAddr();
              app.logger.error(message);
              eh.disconnect();
            }, 3000);
            eh.registerTxEvent(tx_id_string, (tx, code, block_num) => {
              app.logger.info('The chaincode invoke chaincode transaction has been committed on peer %s', eh.getPeerAddr());
              app.logger.info('Transaction %s has status of %s in blocl %s', tx, code, block_num);
              clearTimeout(event_timeout);

              if (code !== 'VALID') {
                const message = util.format('The invoke chaincode transaction was invalid, code:%s', code);
                app.logger.error(message);
                reject(new Error(message));
              } else {
                const message = 'The invoke chaincode transaction was valid.';
                app.logger.info(message);
                resolve(message);
              }
            }, err => {
              clearTimeout(event_timeout);
              app.logger.error(err);
              reject(err);
            },
              // the default for 'unregister' is true for transaction listeners
              // so no real need to set here, however for 'disconnect'
              // the default is false as most event hubs are long running
              // in this use case we are using it only once
            { unregister: true, disconnect: true }
            );
            eh.connect();
          });
          promises.push(invokeEventPromise);
        });

        const orderer_request = {
          txId: tx_id,
          proposalResponses,
          proposal,
        };
        const sendPromise = channel.sendTransaction(orderer_request);
        // put the send to the orderer last so that the events get registered and
        // are ready for the orderering and committing
        promises.push(sendPromise);
        const results = await Promise.all(promises);
        app.logger.debug(util.format('------->>> R E S P O N S E : %j', results));
        const response = results.pop(); //  orderer results are last in the results
        if (response.status === 'SUCCESS') {
          app.logger.info('Successfully sent transaction to the orderer.');
        } else {
          error_message = util.format('Failed to order the transaction. Error code: %s', response.status);
          app.logger.debug(error_message);
        }

        // now see what each of the event hubs reported
        for (const i in results) {
          const event_hub_result = results[i];
          const event_hub = event_hubs[i];
          app.logger.debug('Event results for event hub :%s', event_hub.getPeerAddr());
          if (typeof event_hub_result === 'string') {
            app.logger.debug(event_hub_result);
          } else {
            if (!error_message) error_message = event_hub_result.toString();
            app.logger.debug(event_hub_result.toString());
          }
        }
      } else {
        error_message = util.format('Failed to send Proposal and receive all good ProposalResponse');
        app.logger.debug(error_message);
      }
    } catch (error) {
      app.logger.error('Failed to invoke due to error: ' + error.stack ? error.stack : error);
      error_message = error.toString();
    }

    if (!error_message) {
      const message = util.format(
        'Successfully invoked the chaincode %s to the channel \'%s\' for transaction ID: %s',
        org, channelName, tx_id_string);
      app.logger.info(message);

      return {
        transactionID: tx_id_string,
        success: true,
      };
      // return tx_id_string;
    }
    const message = util.format('Failed to invoke chaincode. cause:%s', error_message);
    app.logger.error(message);
    return {
      success: false,
      message,
    };
    // throw new Error(message);

  }
  async function queryChainCode(network, keyValueStorePath, peer, channelName, chainCodeName, fcn, args, username, org) {
    try {
      // first setup the client for this org
      const client = await getClientForOrg(org, network, username);
      app.logger.debug('Successfully got the fabric client for the organization "%s"', org);
      const channel = await client.getChannel(channelName);
      if (!channel) {
        const message = util.format('Channel %s was not defined in the connection profile', channelName);
        app.logger.error(message);
        // throw new Error(message);
        return {
          success: false,
          message,
        };
      }

      // send query
      const request = {
        targets: [peer], // queryByChaincode allows for multiple targets
        chaincodeId: chainCodeName,
        fcn,
        args,
      };
      const response_payloads = await channel.queryByChaincode(request);
      if (response_payloads) {
        for (let i = 0; i < response_payloads.length; i++) {
          const responseStr = response_payloads[i].toString('utf8');
          if (responseStr.includes('Error:')) {
            return {
              success: false,
              message: response_payloads[i].toString('utf8'),
            };
          }
          return {
            success: true,
            result: response_payloads[i].toString('utf8'),
          };
        }
      } else {
        app.logger.error('response_payloads is null');
        return {
          success: false,
          message: 'response_payloads is null',
        };
      }
    } catch (error) {
      app.logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
      return {
        success: false,
        message: error.toString(),
      };
    }
  }
  async function getChainInfo(network, keyValueStorePath, peer, username, org, channelName = '') {
    try {
      // first setup the client for this org
      const client = await getClientForOrg(org, network, username);
      app.logger.debug('Successfully got the fabric client for the organization "%s"', org);
      const channel = client.getChannel(channelName);
      if (!channel) {
        const message = util.format('Channel %s was not defined in the connection profile', channelName);
        app.logger.error(message);
        throw new Error(message);
      }

      const response_payload = await channel.queryInfo(peer);
      if (response_payload) {
        app.logger.debug(response_payload);
        return response_payload;
      }
      app.logger.error('response_payload is null');
      return 'response_payload is null';

    } catch (error) {
      app.logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
      return error.toString();
    }
  }
  async function getChannelHeight(network, keyValueStorePath, peer, username, org, channelName = '') {
    const response = await getChainInfo(network, keyValueStorePath, peer, username, org, channelName);
    if (response && response.height) {
      app.logger.debug(response.height.low);
      return response.height.low.toString();
    }
    return '0';

  }
  async function getBlockByNumber(network, keyValueStorePath, peer, blockNumber, username, org, channelName = '') {
    try {
      // first setup the client for this org
      const client = await getClientForOrg(org, network, username);
      app.logger.debug('Successfully got the fabric client for the organization "%s"', org);
      const channel = client.getChannel(channelName);
      if (!channel) {
        const message = util.format('Channel %s was not defined in the connection profile', channelName);
        app.logger.error(message);
        throw new Error(message);
      }

      const response_payload = await channel.queryBlock(parseInt(blockNumber, peer));
      if (response_payload) {
        app.logger.debug(response_payload);
        return response_payload;
      }
      app.logger.error('response_payload is null');
      return 'response_payload is null';

    } catch (error) {
      app.logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
      return error.toString();
    }
  }
  async function getBlockInfo(network, keyValueStorePath, peer, blockId, username, org, channelName = '') {
    const message = await getBlockByNumber(network, keyValueStorePath, peer, blockId, username, org, channelName);
    const { header: { data_hash } } = message;
    let txTimestamps = [];
    message.data.data.map(item => {
      const { payload: { header: { channel_header: { timestamp } } } } = item;
      const txTime = moment(timestamp, 'ddd MMM DD YYYY HH:mm:ss GMT+0000 (UTC)');
      return txTimestamps.push(txTime.utc());
    });
    txTimestamps = txTimestamps.sort(function(a, b) { return a - b; });
    app.logger.debug('blockId hash transactions timestamp', blockId, data_hash, message.data.data.length, txTimestamps.slice(-1).pop());
    return {
      id: blockId,
      hash: data_hash,
      transactions: message.data.data.length,
      timestamp: txTimestamps.slice(-1).pop(),
    };
  }
  async function getTransactions(network, keyValueStorePath, peer, blockId, username, org, channelName = '') {
    const message = await getBlockByNumber(network, keyValueStorePath, peer, blockId, username, org, channelName);
    // let transaction = null;
    const transaction = message.data.data.map(item => {
      const { payload: { header: { channel_header: { tx_id, timestamp, channel_id } } } } = item;
      const txTime = moment(timestamp, 'ddd MMM DD YYYY HH:mm:ss GMT+0000 (UTC)');
      if (tx_id) {
        return {
          id: tx_id,
          timestamp: txTime.utc(),
          channelId: channel_id,
        };
      }
      return null;

    });
    return transaction.length > 0 ? transaction[0] : {};
  }
  async function getRecentBlock(network, keyValueStorePath, peer, username, org, count, channelName = '') {
    let height = await getChannelHeight(network, keyValueStorePath, peer, username, org, channelName);
    height = parseInt(height);
    const number = count > height ? height : count;
    const blockIds = [];
    for (let index = height - 1; index >= height - number; index--) {
      blockIds.push(index);
    }
    const promises = [];
    for (const index in blockIds) {
      const blockId = blockIds[index];
      promises.push(getBlockInfo(network, keyValueStorePath, peer, blockId, username, org, channelName));
    }
    return await Promise.all(promises);
  }
  async function getRecentTransactions(network, keyValueStorePath, peer, username, org, count, channelName = '') {
    let height = await getChannelHeight(network, keyValueStorePath, peer, username, org, channelName);
    height = parseInt(height);
    const number = count > height ? height : count;
    const blockIds = [];
    for (let index = height - 1; index >= height - number; index--) {
      blockIds.push(index);
    }
    const promises = [];
    for (const index in blockIds) {
      const blockId = blockIds[index];
      promises.push(getTransactions(network, keyValueStorePath, peer, blockId, username, org, channelName));
    }
    return await Promise.all(promises);
  }
  async function getChannels(network, keyValueStorePath, peer, username, org) {
    try {
      // first setup the client for this org
      const client = await getClientForOrg(org, network, username);
      app.logger.debug('Successfully got the fabric client for the organization "%s"', org);

      const response = await client.queryChannels(peer);
      if (response) {
        app.logger.debug('<<< channels >>>');
        const channelNames = [];
        for (let i = 0; i < response.channels.length; i++) {
          channelNames.push(response.channels[i].channel_id);
        }
        app.logger.debug(channelNames);
        return channelNames;
      }
      app.logger.error('response_payloads is null');
      return [];

    } catch (error) {
      app.logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
      return [];
    }
  }
  async function getChainCodes(network, keyValueStorePath, peer, type, username, org, channelName) {
    const chainCodes = [];
    try {
      // first setup the client for this org
      const client = await getClientForOrg(org, network, username);
      app.logger.debug('Successfully got the fabric client for the organization "%s"', org);

      let response = {};
      switch (type) {
        case 'installed':
          response = await client.queryInstalledChaincodes(peer, true);
          break;
        default: {
          const channel = client.getChannel(channelName);
          if (!channel) {
            const message = util.format('Channel %s was not defined in the connection profile', channelName);
            app.logger.error(message);
            throw new Error(message);
          }
          response = await channel.queryInstantiatedChaincodes(peer, true);
          break;
        }
      }
      app.logger.debug('====================== query chain code ', response);
      if (response) {
        for (let i = 0; i < response.chaincodes.length; i++) {
          app.logger.debug('name: ' + response.chaincodes[i].name + ', version: ' +
              response.chaincodes[i].version + ', path: ' + response.chaincodes[i].path
          );
          chainCodes.push(
            {
              name: response.chaincodes[i].name,
              version: response.chaincodes[i].version,
              path: response.chaincodes[i].path,
            }
          );
        }
      }
    } catch (error) {
      app.logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    }
    return chainCodes;
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
        caClients[key] = new copService(caUrl, null, '', cryptoSuite);
      }
    }
    helper.clients = clients;
    helper.channels = channels;
    helper.caClients = caClients;
    return helper;
  }
  app.fabricHelperV1_2 = fabricHelper;
  app.getClientForOrgV1_2 = getClientForOrg;
  app.getOrgAdminV1_2 = getOrgAdmin;
  app.getChannelForOrgV1_2 = getChannelForOrg;
  app.createChannelV1_2 = createChannel;
  app.joinChannelV1_2 = joinChannel;
  app.installSmartContractV1_2 = installSmartContract;
  app.instantiateSmartContractV1_2 = instantiateSmartContract;
  app.invokeChainCodeV1_2 = invokeChainCode;
  app.queryChainCodeV1_2 = queryChainCode;
  app.getChainInfoV1_2 = getChainInfo;
  app.getChannelHeightV1_2 = getChannelHeight;
  app.getBlockByNumberV1_2 = getBlockByNumber;
  app.getRecentBlockV1_2 = getRecentBlock;
  app.getRecentTransactionsV1_2 = getRecentTransactions;
  app.getChannelsV1_2 = getChannels;
  app.getChainCodesV1_2 = getChainCodes;
  app.getRegisteredUserV1_2 = getRegisteredUser;
  // hfc.setLogger(app.logger);
};
