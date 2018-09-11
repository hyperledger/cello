/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Service = require('egg').Service;

class DeployService extends Service {
  async list() {
    const { ctx } = this;
    const status = ctx.query.status || '';
    const total = await ctx.model.SmartContractDeploy.count({ user: ctx.user.id });
    const instantiatedCount = await ctx.model.SmartContractDeploy.count({ user: ctx.user.id, status: 'instantiated' });
    const instantiatingCount = await ctx.model.SmartContractDeploy.count({ user: ctx.user.id, status: 'instantiating' });
    const errorCount = await ctx.model.SmartContractDeploy.count({ user: ctx.user.id, status: 'error' });
    let data = [];
    if (status !== '') {
      data = await ctx.model.SmartContractDeploy.find({ user: ctx.user.id, status }, '_id name status deployTime').populate('smartContractCode chain smartContract', '_id version name chainId type size').sort('-deployTime');
    } else {
      data = await ctx.model.SmartContractDeploy.find({ user: ctx.user.id }, '_id name status deployTime').populate('smartContractCode chain smartContract', '_id version name chainId type size').sort('-deployTime');
    }
    return {
      total,
      instantiatedCount,
      instantiatingCount,
      errorCount,
      data,
    };
  }
  async query(id) {
    const { ctx } = this;
    const deploy = await ctx.model.SmartContractDeploy.findOne({ _id: id }, '_id name status deployTime').populate('smartContractCode chain smartContract', '_id version name chainId type size default');
    if (!deploy) {
      return {
        success: false,
        message: 'Deploy not found.',
      };
    }
    return {
      success: true,
      deploy,
    };
  }
  async invoke(functionName, args, deployId) {
    const { ctx, config } = this;
    const deploy = await ctx.model.SmartContractDeploy.findOne({ _id: deployId }).populate('smartContractCode smartContract chain');
    const chainId = deploy.chain._id.toString();
    const chain = await ctx.model.Chain.findOne({ _id: chainId });
    const chainRootDir = `${config.dataDir}/${ctx.user.id}/chains/${chainId}`;
    const keyValueStorePath = `${chainRootDir}/client-kvs`;
    const network = await ctx.service.chain.generateNetwork(chainId, chain.type);
    let peers = ['peer1'];
    switch (chain.type) {
      case 'fabric-1.2':
        peers = ['peer0.org1.example.com'];
        break;
      default:
        break;
    }
    const result = await ctx.invokeChainCode(network, keyValueStorePath, peers, config.default.channelName, deploy.name, functionName, args, ctx.user.username, 'org1', chain.type);
    if (result.success) {
      await ctx.model.Operation.create({
        chain: chainId,
        deploy,
        smartContract: deploy.smartContract,
        smartContractCode: deploy.smartContractCode,
        operate: config.operations.Invoke.key,
        fcn: functionName,
        arguments: args,
        user: ctx.user.id,
      });
    } else {
      await ctx.model.Operation.create({
        chain: chainId,
        deploy,
        smartContract: deploy.smartContract,
        smartContractCode: deploy.smartContractCode,
        operate: config.operations.Invoke.key,
        success: false,
        error: result.message,
        fcn: functionName,
        arguments: args,
        user: ctx.user.id,
      });
    }
    return result;
  }

  async queryChainCode(functionName, args, deployId) {
    const { ctx, config } = this;
    const deploy = await ctx.model.SmartContractDeploy.findOne({ _id: deployId }).populate('smartContractCode smartContract chain');
    const chainId = deploy.chain._id.toString();
    const chain = await ctx.model.Chain.findOne({ _id: chainId });
    const chainRootDir = `${config.dataDir}/${ctx.user.id}/chains/${chainId}`;
    const keyValueStorePath = `${chainRootDir}/client-kvs`;
    const network = await ctx.service.chain.generateNetwork(chainId, chain.type);
    let peer = 'peer1';
    switch (chain.type) {
      case 'fabric-1.2':
        peer = 'peer0.org1.example.com';
        break;
      default:
        break;
    }
    const result = await ctx.queryChainCode(network, keyValueStorePath, peer, config.default.channelName, deploy.name, functionName, args, ctx.user.username, 'org1', chain.type);
    if (result.success) {
      await ctx.model.Operation.create({
        chain: chainId,
        deploy,
        smartContract: deploy.smartContract,
        smartContractCode: deploy.smartContractCode,
        operate: config.operations.Query.key,
        fcn: functionName,
        arguments: args,
        result: result.result,
        user: ctx.user.id,
      });
    } else {
      await ctx.model.Operation.create({
        chain: chainId,
        deploy,
        smartContract: deploy.smartContract,
        smartContractCode: deploy.smartContractCode,
        operate: config.operations.Query.key,
        success: false,
        error: result.message,
        fcn: functionName,
        arguments: args,
        user: ctx.user.id,
      });
    }
    return result;
  }
}

module.exports = DeployService;
