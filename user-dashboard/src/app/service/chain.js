/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Service = require('egg').Service;
const qs = require('qs');
const shell = require('shelljs');
const fs = require('fs-extra');
const rimraf = require('rimraf');
const moment = require('moment');

class ChainService extends Service {
  async list() {
    const { ctx, config } = this;
    const listUrl = config.operator.url.cluster.list;
    let chains = [];
    const response = await ctx.curl(`${listUrl}?${qs.stringify({
      user_id: ctx.user.id,
    })}`, {
      method: 'GET',
      timeout: 30000,
      contentType: 'json',
      dataType: 'json',
      headers: {
        Authorization: `Bearer ${ctx.user.token}`,
      },
    });
    ctx.logger.debug('response ', response);
    if (response.status === 200) {
      const ids = response.data.data.map(chain => { return chain.id; });
      chains = await ctx.model.Chain.find({ chainId: { $in: ids } });
    }

    return {
      data: chains,
    };
  }
  async cleanDB(chainId) {
    const { ctx } = this;
    const chain = await ctx.model.Chain.findOne({ chainId });
    const networkConfig = await ctx.model.NetworkConfig.findOne({ chain: chain._id.toString() });
    const networkConfigId = networkConfig._id.toString();
    const orderers = await ctx.model.OrdererConfig.find({ networkConfig: networkConfigId });
    const deploys = await ctx.model.SmartContractDeploy.find({ chain });
    deploys.map(deploy => {
      return deploy.remove();
    });
    orderers.map(ordererItem => {
      return ordererItem.remove();
    });
    const orgs = await ctx.model.OrgConfig.find({ networkConfig: networkConfigId });
    orgs.map(orgItem => {
      return orgItem.remove();
    });
    const peers = await ctx.model.PeerConfig.find({ networkConfig: networkConfigId });
    peers.map(peerItem => {
      return peerItem.remove();
    });
    const cas = await ctx.model.CaConfig.find({ networkConfig: networkConfigId });
    cas.map(caItem => {
      return caItem.remove();
    });
    networkConfig.remove();
    chain.remove();
  }
  async cleanStore(chainId) {
    const { config, ctx } = this;
    const chainRootDir = `${config.dataDir}/${ctx.user.id}/chains/${chainId}`;
    rimraf(chainRootDir, function() { ctx.logger.info(`delete directory ${chainRootDir}`); });
  }
  async release() {
    const { ctx, config } = this;
    const operateUrl = config.operator.url.cluster.operate;
    const clusterId = ctx.params.id;
    const chain = await ctx.model.Chain.findOne({ chainId: clusterId });
    const response = await ctx.curl(operateUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ctx.user.token}`,
      },
      data: {
        action: 'release',
        user_id: ctx.user.id,
        cluster_id: clusterId,
      },
      timeout: 60000,
    });
    if (response.status === 200) {
      await this.cleanDB(clusterId);
      await this.cleanStore(chain._id.toString());
    }
  }
  async findRegex(regex, value) {
    const matches = [];
    await value.replace(regex, async match => {
      matches.push(match);
    });
    return matches;
  }
  async handle_url(chainId, networkConfigId, key, value) {
    const { ctx } = this;
    const number_regex = /[+-]?\d+(\.\d+)?/g;
    let matches = [];
    if (key.startsWith('ca_org')) {
      matches = await this.findRegex(number_regex, key);
      const caIndex = parseInt(matches[0]);
      await ctx.model.CaConfig.create({
        address: value,
        sequence: caIndex,
        networkConfig: networkConfigId,
      });
    } else if (key.startsWith('peer')) {
      const peerType = key.split('_').slice(-1)[0];
      matches = await this.findRegex(number_regex, key);
      const orgIndex = parseInt(matches[1]);
      const peerIndex = parseInt(matches[0]);
      const org = await ctx.model.OrgConfig.findOneAndUpdate({
        networkConfig: networkConfigId,
        sequence: orgIndex,
        name: `peerOrg${orgIndex}`,
        mspid: `Org${orgIndex}MSP`,
      }, { name: `peerOrg${orgIndex}`, mspid: `Org${orgIndex}MSP` }, { upsert: true, new: true });
      const updateData = {};
      updateData[`${peerType}`] = value;
      await ctx.model.PeerConfig.findOneAndUpdate({
        orgConfig: org._id.toString(),
        networkConfig: networkConfigId,
        sequence: peerIndex,
      }, updateData, { upsert: true, new: true });
    } else if (key === 'orderer') {
      await ctx.model.OrdererConfig.create({
        networkConfig: networkConfigId,
        url: value,
      });
    }
  }
  async generateNetworkFabricV1_0(chainId) {
    const { ctx } = this;
    const chain = await ctx.model.Chain.findOne({ _id: chainId });
    const networkConfig = await ctx.model.NetworkConfig.findOne({ chain });
    const orgConfigs = await ctx.model.OrgConfig.find({ networkConfig }).sort('sequence');
    const ordererConfig = await ctx.model.OrdererConfig.findOne({ networkConfig });
    const network = {
      orderer: {
        url: `grpcs://${ordererConfig.url}`,
        'server-hostname': ordererConfig.serverHostName,
        tls_cacerts: '/var/www/app/lib/fabric/fixtures/channel/v1.0/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt',
      },
    };
    for (const index in orgConfigs) {
      const orgConfig = orgConfigs[index];
      const caConfig = await ctx.model.CaConfig.findOne({ networkConfig, sequence: orgConfig.sequence });
      const peerConfigs = await ctx.model.PeerConfig.find({ networkConfig, orgConfig }).sort('sequence');
      const peers = {};
      for (const peerIndex in peerConfigs) {
        const peerConfig = peerConfigs[peerIndex];
        peers[`peer${peerConfig.sequence + 1}`] = {
          requests: `grpcs://${peerConfig.grpc}`,
          events: `grpcs://${peerConfig.event}`,
          'server-hostname': `peer${peerConfig.sequence}.org${orgConfig.sequence}.example.com`,
          tls_cacerts: `/var/www/app/lib/fabric/fixtures/channel/v1.0/crypto-config/peerOrganizations/org${orgConfig.sequence}.example.com/peers/peer${peerConfig.sequence}.org${orgConfig.sequence}.example.com/tls/ca.crt`,
        };
      }
      network[`org${orgConfig.sequence}`] = {
        name: orgConfig.name,
        mspid: orgConfig.mspid,
        ca: `https://${caConfig.address}`,
        peers,
        admin: {
          key: `/var/www/app/lib/fabric/fixtures/channel/v1.0/crypto-config/peerOrganizations/org${orgConfig.sequence}.example.com/users/Admin@org${orgConfig.sequence}.example.com/msp/keystore`,
          cert: `/var/www/app/lib/fabric/fixtures/channel/v1.0/crypto-config/peerOrganizations/org${orgConfig.sequence}.example.com/users/Admin@org${orgConfig.sequence}.example.com/msp/signcerts`,
        },
      };
    }

    return network;
  }
  async generateNetworkFabricV1_2(chainId) {
    const { ctx, config } = this;
    const chain = await ctx.model.Chain.findOne({ _id: chainId });
    const networkConfig = await ctx.model.NetworkConfig.findOne({ chain });
    const orgConfigs = await ctx.model.OrgConfig.find({ networkConfig }).sort('sequence');
    const orgConfigCount = await ctx.model.OrgConfig.count({ networkConfig });
    const ordererConfig = await ctx.model.OrdererConfig.findOne({ networkConfig });
    const chainRootDir = `${config.dataDir}/${ctx.user.id}/chains/${chain._id.toString()}`;
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
    orderers[ordererConfig.serverHostName] = {
      grpcOptions: {
        'ssl-target-name-override': ordererConfig.serverHostName,
      },
      tlsCACerts: {
        path: '/var/www/app/lib/fabric/fixtures/channel/v1.2/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt',
      },
      url: `grpcs://${ordererConfig.url}`,
    };
    const channelsPeers = {};
    let network = {};
    for (let index = 0; index < orgConfigCount; index++) {
      const orgConfig = orgConfigs[index];
      const caConfig = await ctx.model.CaConfig.findOne({ networkConfig, sequence: orgConfig.sequence });
      const peerConfigs = await ctx.model.PeerConfig.find({ networkConfig, orgConfig }).sort('sequence');
      const peerConfigCount = await ctx.model.PeerConfig.count({ networkConfig, orgConfig });
      const peerNames = [];
      for (let peerIndex = 0; peerIndex < peerConfigCount; peerIndex++) {
        peerNames.push(`peer${peerIndex}.org${index + 1}.example.com`);
        peers[`peer${peerIndex}.org${index + 1}.example.com`] = {
          eventUrl: `grpcs://${peerConfigs[peerIndex].event}`,
          grpcOptions: {
            'ssl-target-name-override': `peer${peerIndex}.org${index + 1}.example.com`,
          },
          tlsCACerts: {
            path: `/var/www/app/lib/fabric/fixtures/channel/v1.2/crypto-config/peerOrganizations/org${index + 1}.example.com/peers/peer${peerIndex}.org${index + 1}.example.com/tls/ca.crt`,
          },
          url: `grpcs://${peerConfigs[peerIndex].grpc}`,
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
        url: `https://${caConfig.address}`,
      };
      network[`org${index + 1}`] = {
        'x-type': 'hlfv1',
        name: `${chain.name}-org${index + 1}`,
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
    channelsConfig[`${config.default.channelName}`] = channels;
    network = Object.assign(network, {
      config: {
        version: '1.0',
        'x-type': 'hlfv1',
        name: `${chain.name}`,
        description: `${chain.name}`,
        orderers,
        certificateAuthorities,
        organizations,
        peers,
        channels: channelsConfig,
      },
    });
    return network;
  }
  async generateNetwork(chainId, chainType = 'fabric-1.0') {
    switch (chainType) {
      case 'fabric-1.0':
      default:
        return await this.generateNetworkFabricV1_0(chainId);
      case 'fabric-1.2':
        return await this.generateNetworkFabricV1_2(chainId);
    }
  }
  async initialFabric(chain) {
    const { ctx, config } = this;
    const chainRootDir = `${config.dataDir}/${ctx.user.id}/chains/${chain._id.toString()}`;
    const channelConfigPath = `${chainRootDir}/tx`;
    const keyValueStorePath = `${chainRootDir}/client-kvs`;
    const keyValueStoreBackPath = `${chainRootDir}/client-kvs/tmp`;
    fs.ensureDirSync(channelConfigPath);
    fs.ensureDirSync(keyValueStorePath);
    fs.ensureDirSync(keyValueStoreBackPath);
    if (shell.exec(`FABRIC_CFG_PATH=/etc/hyperledger/${chain.type} /usr/local/bin/${chain.type}/configtxgen -profile TwoOrgsChannel -channelID ${config.default.channelName} -outputCreateChannelTx ${channelConfigPath}/${config.default.channelName}.tx`).code !== 0) {
      ctx.logger.error('run failed');
    }
    const network = await this.generateNetwork(chain._id.toString(), chain.type);
    ctx.logger.debug('network ', JSON.stringify(network, null, 2));
    if (chain.type === 'fabric-1.2') {
      await ctx.getRegisteredUserV1_2(network, ctx.user.username, 'org1', true);
    }
    let peers = ['peer1', 'peer2'];
    switch (chain.type) {
      case 'fabric-1.2':
        peers = ['peer0.org1.example.com', 'peer1.org1.example.com'];
        break;
      default:
        break;
    }
    await ctx.createChannel(network, keyValueStorePath, config.default.channelName, channelConfigPath, 'org1', chain.type);
    await ctx.sleep(1000);
    await ctx.joinChannel(network, keyValueStorePath, config.default.channelName, peers, 'org1', chain.type, ctx.user.username);
  }
  async apply() {
    const { ctx, config } = this;
    const operateUrl = config.operator.url.cluster.operate;
    const { type, size, name } = ctx.request.body;
    const response = await ctx.curl(operateUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ctx.user.token}`,
      },
      data: {
        action: 'apply',
        user_id: ctx.user.id,
        size,
        type,
      },
    });
    if (response.status === 200) {
      const data = JSON.parse(response.data.toString());
      const { service_url } = data.data;
      const chain = await ctx.model.Chain.create({
        chainId: data.data.id,
        user: ctx.user.id,
        serviceUrl: service_url,
        size,
        type,
        name,
      });
      const networkConfig = await ctx.model.NetworkConfig.create({
        user: ctx.user.id,
        chain: chain._id.toString(),
      });
      await ctx.model.Operation.create({
        user: ctx.user.id,
        chain: chain._id.toString(),
        operate: config.operations.ApplyChain.key,
      });
      for (const key in service_url) {
        await this.handle_url(chain._id.toString(), networkConfig._id.toString(), key, service_url[key]);
      }
      this.initialFabric(chain);
    }
    return response.status === 200;
  }
  async getChannelHeight(chainId, chainType = 'fabric-1.0') {
    const { ctx, config } = this;
    const chainRootDir = `${config.dataDir}/${ctx.user.id}/chains/${chainId}`;
    const keyValueStorePath = `${chainRootDir}/client-kvs`;
    const network = await this.generateNetwork(chainId, chainType);
    let peer = 'peer1';
    switch (chainType) {
      case 'fabric-1.2':
        peer = 'peer0.org1.example.com';
        break;
      default:
        break;
    }

    return await ctx.getChannelHeight(network, keyValueStorePath, peer, ctx.user.username, 'org1', chainType, config.default.channelName);
  }
  async getChannels(chainId, chainType) {
    const { ctx, config } = this;
    const chainRootDir = `${config.dataDir}/${ctx.user.id}/chains/${chainId}`;
    const keyValueStorePath = `${chainRootDir}/client-kvs`;
    const network = await this.generateNetwork(chainId, chainType);
    let peer = 'peer1';
    switch (chainType) {
      case 'fabric-1.2':
        peer = 'peer0.org1.example.com';
        break;
      default:
        break;
    }

    return await ctx.getChannels(network, keyValueStorePath, peer, ctx.user.username, 'org1', chainType);
  }
  async getChainCodes(chainId, type, chainType = 'fabric-1.0') {
    const { ctx, config } = this;
    const chainRootDir = `${config.dataDir}/${ctx.user.id}/chains/${chainId}`;
    const keyValueStorePath = `${chainRootDir}/client-kvs`;
    const network = await this.generateNetwork(chainId, chainType);
    let peer = 'peer1';
    switch (chainType) {
      case 'fabric-1.2':
        peer = 'peer0.org1.example.com';
        break;
      default:
        break;
    }

    return await ctx.getChainCodes(network, keyValueStorePath, peer, type, ctx.user.username, 'org1', chainType, config.default.channelName);
  }
  async getBlockByNumber(chainId, blockNumber) {
    const { ctx, config } = this;
    const chainRootDir = `${config.dataDir}/${ctx.user.id}/chains/${chainId}`;
    const keyValueStorePath = `${chainRootDir}/client-kvs`;
    const network = await this.generateNetwork(chainId);
    const chain = await ctx.model.Chain.findOne({ _id: chainId });
    let peer = 'peer1';
    switch (chain.type) {
      case 'fabric-1.2':
        peer = 'peer0.org1.example.com';
        break;
      default:
        break;
    }

    const block = await ctx.getBlockByNumber(network, keyValueStorePath, peer, blockNumber, ctx.user.username, 'org1', chain.type);
    if (block && typeof block === 'string' && block.includes('Error:')) {
      return {
        success: false,
        block,
      };
    }
    const txList = [];
    block.data.data.map(item => {
      const { payload: { header: { channel_header: { tx_id, timestamp, channel_id } } } } = item;
      const txTime = moment(timestamp, 'ddd MMM DD YYYY HH:mm:ss GMT+0000 (UTC)');
      return txList.push({
        id: tx_id,
        timestamp: txTime.unix(),
        channelId: channel_id,
      });
    });
    return {
      success: true,
      txList,
    };
  }
  async getRecentBlock(chainId, count, chainType = 'fabric-1.0') {
    const { ctx, config } = this;
    const chainRootDir = `${config.dataDir}/${ctx.user.id}/chains/${chainId}`;
    const keyValueStorePath = `${chainRootDir}/client-kvs`;
    const network = await this.generateNetwork(chainId, chainType);
    let peer = 'peer1';
    switch (chainType) {
      case 'fabric-1.2':
        peer = 'peer0.org1.example.com';
        break;
      default:
        break;
    }

    return await ctx.getRecentBlock(network, keyValueStorePath, peer, ctx.user.username, 'org1', count, chainType, config.default.channelName);
  }
  async getRecentTransactions(chainId, count, chainType) {
    const { ctx, config } = this;
    const chainRootDir = `${config.dataDir}/${ctx.user.id}/chains/${chainId}`;
    const keyValueStorePath = `${chainRootDir}/client-kvs`;
    const network = await this.generateNetwork(chainId, chainType);
    let peer = 'peer1';
    switch (chainType) {
      case 'fabric-1.2':
        peer = 'peer0.org1.example.com';
        break;
      default:
        break;
    }

    return await ctx.getRecentTransactions(network, keyValueStorePath, peer, ctx.user.username, 'org1', count, chainType, config.default.channelName);
  }
}

module.exports = ChainService;
