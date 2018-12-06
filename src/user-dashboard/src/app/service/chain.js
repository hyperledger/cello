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
    if (response.status === 200) {
      const ids = response.data.data.map(chain => { return chain.id; });
      const query = new ctx.Parse.Query(ctx.parse.Chain);
      query.containedIn('chainId', ids);
      chains = await query.find();
    }

    return {
      data: chains,
    };
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
    const dbChainQuery = new ctx.Parse.Query(ctx.parse.Chain);
    dbChainQuery.equalTo('chainId', clusterId);
    const chain = await dbChainQuery.first();
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
      if (chain) {
        chain.destroy();
      }
      await this.cleanStore(chain.id);
    }
  }
  async initialFabric(chain) {
    const { ctx, config } = this;
    const chainRootDir = `${config.dataDir}/${ctx.user.id}/chains/${chain.id}`;
    const channelConfigPath = `${chainRootDir}/tx`;
    const keyValueStorePath = `${chainRootDir}/client-kvs`;
    const keyValueStoreBackPath = `${chainRootDir}/client-kvs/tmp`;
    fs.ensureDirSync(channelConfigPath);
    fs.ensureDirSync(keyValueStorePath);
    fs.ensureDirSync(keyValueStoreBackPath);
    if (shell.exec(`FABRIC_CFG_PATH=/etc/hyperledger/${chain.get('type')} /usr/local/bin/${chain.get('type')}/configtxgen -profile TwoOrgsChannel -channelID ${config.default.channelName} -outputCreateChannelTx ${channelConfigPath}/${config.default.channelName}.tx`).code !== 0) {
      ctx.logger.error('run failed');
    }
    const network = await chain.generateNetwork();
    ctx.logger.debug('network ', JSON.stringify(network, null, 2));
    if (chain.get('type') === 'fabric-1.2') {
      await ctx.getRegisteredUserV1_2(network, ctx.user.username, 'org1', true);
    }
    let peers = ['peer1', 'peer2'];
    switch (chain.get('type')) {
      case 'fabric-1.2':
        peers = ['peer0.org1.example.com', 'peer1.org1.example.com'];
        break;
      default:
        break;
    }
    await ctx.createChannel(network, keyValueStorePath, config.default.channelName, channelConfigPath, 'org1', chain.get('type'));
    await ctx.sleep(1000);
    await ctx.joinChannel(network, keyValueStorePath, config.default.channelName, peers, 'org1', chain.get('type'), ctx.user.username);
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
      const chain = new ctx.parse.Chain();
      await chain.save({
        chainId: data.data.id,
        user: ctx.user.id,
        serviceUrl: service_url,
        initialized: false,
        applyTime: new Date(),
        size,
        type,
        name,
      });
      const networkConfig = new ctx.parse.NetworkConfig();
      await networkConfig.save({
        user: ctx.user.id,
        chain,
      });
      const operation = new ctx.parse.Operation();
      await operation.save({
        user: ctx.user.id,
        chain,
        operate: config.operations.ApplyChain.key,
        success: true,
      });
      await networkConfig.storeServiceUrl(service_url);
      this.initialFabric(chain);
    }
    return response.status === 200;
  }
  async getChannelHeight(chainId, chainType = 'fabric-1.0') {
    const { ctx, config } = this;
    const chainRootDir = `${config.dataDir}/${ctx.user.id}/chains/${chainId}`;
    const keyValueStorePath = `${chainRootDir}/client-kvs`;
    const chainQuery = new ctx.Parse.Query(ctx.parse.Chain);
    const chain = await chainQuery.get(chainId);
    const network = await chain.generateNetwork();
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
    const chainQuery = new ctx.Parse.Query(ctx.parse.Chain);
    const chain = await chainQuery.get(chainId);
    const network = await chain.generateNetwork();
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
    const chainQuery = new ctx.Parse.Query(ctx.parse.Chain);
    const chain = await chainQuery.get(chainId);
    const network = await chain.generateNetwork();
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
    const chainQuery = new ctx.Parse.Query(ctx.parse.Chain);
    const chain = await chainQuery.get(chainId);
    const network = await chain.generateNetwork();
    let peer = 'peer1';
    switch (chain.get('type')) {
      case 'fabric-1.2':
        peer = 'peer0.org1.example.com';
        break;
      default:
        break;
    }

    const block = await ctx.getBlockByNumber(network, keyValueStorePath, peer, blockNumber, ctx.user.username, 'org1', chain.get('type'));
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
    const chainQuery = new ctx.Parse.Query(ctx.parse.Chain);
    const chain = await chainQuery.get(chainId);
    const network = await chain.generateNetwork();
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
    const chainQuery = new ctx.Parse.Query(ctx.parse.Chain);
    const chain = await chainQuery.get(chainId);
    const network = await chain.generateNetwork();
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
