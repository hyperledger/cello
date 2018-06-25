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
    const deploy = await ctx.model.SmartContractDeploy.findOne({ _id: id }, '_id name status deployTime').populate('smartContractCode chain smartContract', '_id version name chainId type size');
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
    const chainRootDir = `${config.dataDir}/${ctx.user.id}/chains/${chainId}`;
    const keyValueStorePath = `${chainRootDir}/client-kvs`;
    const network = await ctx.service.chain.generateNetwork(chainId);
    return await ctx.invokeChainCode(network, keyValueStorePath, ['peer1'], config.default.channelName, deploy.name, functionName, args, ctx.user.username, 'org1');
  }
  // async function queryChainCode(network, keyValueStorePath, peer,  channelName, chainCodeName, fcn, args, username, org) {
  async queryChainCode(functionName, args, deployId) {
    const { ctx, config } = this;
    const deploy = await ctx.model.SmartContractDeploy.findOne({ _id: deployId }).populate('smartContractCode smartContract chain');
    const chainId = deploy.chain._id.toString();
    const chainRootDir = `${config.dataDir}/${ctx.user.id}/chains/${chainId}`;
    const keyValueStorePath = `${chainRootDir}/client-kvs`;
    const network = await ctx.service.chain.generateNetwork(chainId);
    return await ctx.queryChainCode(network, keyValueStorePath, 'peer1', config.default.channelName, deploy.name, functionName, args, ctx.user.username, 'org1');
  }
}

module.exports = DeployService;
