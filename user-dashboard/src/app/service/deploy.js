/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Service = require('egg').Service;

class DeployService extends Service {
  async list() {
    const { ctx } = this;
    const status = ctx.query.status || '';
    let smartContractDeployQuery = new ctx.Parse.Query(ctx.parse.SmartContractDeploy);
    smartContractDeployQuery.equalTo('user', ctx.user.id);
    const total = await smartContractDeployQuery.count();
    smartContractDeployQuery.equalTo('status', 'instantiated');
    const instantiatedCount = await smartContractDeployQuery.count();
    smartContractDeployQuery.equalTo('status', 'instantiating');
    const instantiatingCount = await smartContractDeployQuery.count();
    smartContractDeployQuery.equalTo('status', 'error');
    const errorCount = await smartContractDeployQuery.count();

    smartContractDeployQuery.include(['smartContractCode', 'smartContract', 'chain']);
    if (status !== '') {
      smartContractDeployQuery.equalTo('status', status);
    } else {
      smartContractDeployQuery = new ctx.Parse.Query(ctx.parse.SmartContractDeploy);
      smartContractDeployQuery.equalTo('user', ctx.user.id);
      smartContractDeployQuery.include(['smartContractCode', 'smartContract', 'chain']);
    }
    const data = await smartContractDeployQuery.find();
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
    const deployQuery = new ctx.Parse.Query(ctx.parse.SmartContractDeploy);
    deployQuery.include(['smartContractCode', 'chain', 'smartContract']);
    const deploy = await deployQuery.get(id);
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
    const deployQuery = new ctx.Parse.Query(ctx.parse.SmartContractDeploy);
    deployQuery.include(['chain', 'smartContract', 'smartContractCode']);
    const deploy = await deployQuery.get(deployId);
    const chain = deploy.get('chain');
    const chainId = chain.id;
    const chainRootDir = `${config.dataDir}/${ctx.user.id}/chains/${chainId}`;
    const keyValueStorePath = `${chainRootDir}/client-kvs`;
    const network = await chain.generateNetwork();
    let peers = ['peer1'];
    switch (chain.get('type')) {
      case 'fabric-1.2':
        peers = ['peer0.org1.example.com'];
        break;
      default:
        break;
    }
    const result = await ctx.invokeChainCode(network, keyValueStorePath, peers, config.default.channelName, deploy.get('name'), functionName, args, ctx.user.username, 'org1', chain.get('type'));
    const operation = new ctx.parse.Operation();
    if (result.success) {
      await operation.save({
        chain,
        deploy,
        smartContract: deploy.get('smartContract'),
        smartContractCode: deploy.get('smartContractCode'),
        operate: config.operations.Invoke.key,
        fcn: functionName,
        arguments: args,
        user: ctx.user.id,
        success: true,
      });
    } else {
      await operation.save({
        chain,
        deploy,
        smartContract: deploy.get('smartContract'),
        smartContractCode: deploy.get('smartContractCode'),
        operate: config.operations.Invoke.key,
        fcn: functionName,
        arguments: args,
        user: ctx.user.id,
        error: result.message,
        success: false,
      });
    }
    return result;
  }

  async queryChainCode(functionName, args, deployId) {
    const { ctx, config } = this;
    const deployQuery = new ctx.Parse.Query(ctx.parse.SmartContractDeploy);
    deployQuery.include(['chain', 'smartContract', 'smartContractCode']);
    const deploy = await deployQuery.get(deployId);
    const chain = deploy.get('chain');
    const chainId = chain.id;
    const chainRootDir = `${config.dataDir}/${ctx.user.id}/chains/${chainId}`;
    const keyValueStorePath = `${chainRootDir}/client-kvs`;
    const network = await chain.generateNetwork();
    let peer = 'peer1';
    switch (chain.get('type')) {
      case 'fabric-1.2':
        peer = 'peer0.org1.example.com';
        break;
      default:
        break;
    }
    const result = await ctx.queryChainCode(network, keyValueStorePath, peer, config.default.channelName, deploy.get('name'), functionName, args, ctx.user.username, 'org1', chain.get('type'));
    const operation = new ctx.parse.Operation();
    if (result.success) {
      await operation.save({
        chain,
        deploy,
        smartContract: deploy.get('smartContract'),
        smartContractCode: deploy.get('smartContractCode'),
        operate: config.operations.Query.key,
        fcn: functionName,
        arguments: args,
        user: ctx.user.id,
        success: true,
        result: result.result,
      });
    } else {
      await operation.save({
        chain,
        deploy,
        smartContract: deploy.get('smartContract'),
        smartContractCode: deploy.get('smartContractCode'),
        operate: config.operations.Query.key,
        fcn: functionName,
        arguments: args,
        user: ctx.user.id,
        success: false,
        error: result.message,
      });
    }
    return result;
  }
}

module.exports = DeployService;
