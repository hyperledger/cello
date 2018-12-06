/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Service = require('egg').Service;
const fs = require('fs-extra');
const commonFs = require('fs');
const shell = require('shelljs');
const path = require('path');
const awaitWriteStream = require('await-stream-ready').write;
const sendToWormhole = require('stream-wormhole');
const AdmZip = require('adm-zip');
const rimraf = require('rimraf');

class SmartContractService extends Service {
  async list() {
    const { ctx } = this;
    const smartContractQuery = new ctx.Parse.Query(ctx.parse.SmartContract);
    smartContractQuery.equalTo('user', ctx.user.id);
    return await smartContractQuery.find();
  }
  async copySystemSmartContract(userId) {
    const { ctx, config } = this;
    const smartContractRootDir = `${config.dataDir}/${userId}/smart_contract`;
    for (const networkType in config.default.smartContracts) {
      const networkSmartContract = config.default.smartContracts[networkType];
      for (const idx in networkSmartContract) {
        const dbSmartContract = new ctx.parse.SmartContract();
        const smartContract = networkSmartContract[idx];
        await dbSmartContract.save({
          name: smartContract.name,
          description: smartContract.description,
          default: smartContract.default,
          user: userId,
        });
        const smartContractId = dbSmartContract.id;
        const smartContractPath = `${smartContractRootDir}/${smartContractId}`;
        const smartContractCodePath = `${smartContractRootDir}/${smartContractId}/${smartContract.version}`;
        fs.ensureDirSync(smartContractCodePath);
        shell.cp('-R', `${smartContract.path}/*`, smartContractCodePath);
        dbSmartContract.set('path', smartContractPath);
        await dbSmartContract.save();

        const smartContactCode = new ctx.parse.SmartContractCode();
        await smartContactCode.save({
          smartContract: dbSmartContract,
          path: smartContractCodePath,
          version: smartContract.version,
        });
      }
    }
  }
  async storeSmartContract(stream) {
    const { ctx, config } = this;
    const id = ctx.query.id;
    const smartContractRootDir = `${config.dataDir}/${ctx.user.id}/smart_contract`;
    let smartContract = new ctx.parse.SmartContract();
    // const smartContractId = id || new ObjectID();
    let smartContractId = id;

    if (!id) {
      await smartContract.save({
        user: ctx.user.id,
      });
      smartContractId = smartContract.id;
    } else {
      const smartContractQuery = new ctx.Parse.Query(ctx.parse.SmartContract);
      smartContract = await smartContractQuery.get(id);
    }

    const targetFileName = `${smartContractId}${path.extname(stream.filename)}`;
    const smartContractPath = `${smartContractRootDir}/${smartContractId}`;
    const smartContractCodePath = `${smartContractRootDir}/${smartContractId}/tmp`;
    const zipFile = path.join(smartContractPath, targetFileName);

    fs.ensureDirSync(smartContractCodePath);
    const writeStream = fs.createWriteStream(zipFile);
    try {
      await awaitWriteStream(stream.pipe(writeStream));
      if (!id) {
        smartContract.set('path', smartContractPath);
        await smartContract.save();
      }
    } catch (err) {
      await sendToWormhole(stream);
      if (!id) {
        await smartContract.destroy();
      }
      return {
        success: false,
      };
    }
    const zip = AdmZip(zipFile);
    zip.extractAllTo(smartContractCodePath, true);
    commonFs.unlinkSync(zipFile);
    const smartContractCode = new ctx.parse.SmartContractCode();
    await smartContractCode.save({
      smartContract,
      path: smartContractCodePath,
    });
    return {
      id: smartContractCode.id,
      success: true,
    };
  }
  async removeSmartContractCode(id) {
    const { ctx } = this;
    const smartContractCodeQuery = new ctx.Parse.Query(ctx.parse.SmartContractCode);
    const smartContractCode = await smartContractCodeQuery.get(id);
    if (smartContractCode) {
      smartContractCode.destroy();
    }
  }
  async updateSmartContractCode(id) {
    const { ctx } = this;
    const smartContractCodeQuery = new ctx.Parse.Query(ctx.parse.SmartContractCode);
    smartContractCodeQuery.include('smartContract');
    const smartContractCode = await smartContractCodeQuery.get(id);
    if (!smartContractCode || !smartContractCode.get('smartContract')) {
      return {
        success: false,
      };
    }
    const smartContract = smartContractCode.get('smartContract');
    const version = ctx.request.body.version || smartContractCode.get('version');
    const description = ctx.request.body.description || smartContract.get('description');
    const smartContractPath = smartContract.get('path');
    const name = ctx.request.body.name || smartContract.get('name');
    const smartContractCodePath = `${smartContractPath}/${version}`;
    if (smartContractCodePath !== smartContractCode.get('path')) {
      fs.ensureDirSync(smartContractCodePath);
      await shell.cp('-R', `${smartContractCode.get('path')}/*`, smartContractCodePath);
      rimraf(smartContractCode.get('path'), function() {
        ctx.logger.debug(`delete smart contract path ${smartContractCode.get('path')}`);
      });
    }
    smartContractCode.set('path', smartContractCodePath);
    smartContractCode.set('version', version);
    await smartContractCode.save();

    smartContract.set('name', name);
    smartContract.set('description', description);
    await smartContract.save();
    const smartContractOperateHistory = new ctx.parse.SmartContractOperateHistory();

    await smartContractOperateHistory.save({
      user: smartContract.user,
      smartContract,
      smartContractCode,
      operate: 'new',
    });
    return {
      success: true,
    };
  }
  async deleteSmartContract(id) {
    const { ctx } = this;
    const smartContractQuery = new ctx.Parse.Query(ctx.parse.SmartContract);
    const smartContract = await smartContractQuery.get(id);
    await smartContract.destroy();
  }
  async querySmartContract(id) {
    const { ctx } = this;
    const smartContractQuery = new ctx.Parse.Query(ctx.parse.SmartContract);
    const smartContract = await smartContractQuery.get(id);
    if (!smartContract) {
      return {
        success: false,
      };
    }
    const smartContractCodeQuery = new ctx.Parse.Query(ctx.parse.SmartContractCode);
    smartContractCodeQuery.equalTo('smartContract', smartContract);
    smartContractCodeQuery.descending('createdAt');
    const codes = await smartContractCodeQuery.find();
    const operationQuery = new ctx.Parse.Query(ctx.parse.SmartContractOperateHistory);
    operationQuery.equalTo('smartContract', smartContract);
    operationQuery.include(['smartContractCode']);
    operationQuery.descending('createdAt');
    const newOperations = await operationQuery.find();
    const deployQuery = new ctx.Parse.Query(ctx.parse.SmartContractDeploy);
    deployQuery.equalTo('smartContract', smartContract);
    deployQuery.include(['chain', 'smartContractCode']);
    deployQuery.descending('createdAt');
    const deploys = await deployQuery.find();
    return {
      success: true,
      info: smartContract,
      codes,
      newOperations,
      deploys,
    };
  }
  async deploySmartContractCode(id, chainId, operation) {
    const { ctx, config, app } = this;

    const { functionName, args, deployId } = ctx.request.body;
    const chainRootDir = `${config.dataDir}/${ctx.user.id}/chains/${chainId}`;
    const keyValueStorePath = `${chainRootDir}/client-kvs`;
    const chainQuery = new ctx.Parse.Query(ctx.parse.Chain);
    const chain = await chainQuery.get(chainId);
    const network = await chain.generateNetwork();
    let peers = ['peer1', 'peer2'];
    switch (chain.get('type')) {
      case 'fabric-1.2':
        peers = ['peer0.org1.example.com', 'peer1.org1.example.com'];
        break;
      default:
        break;
    }
    switch (operation) {
      case 'install':
        return await ctx.installSmartContract(network, keyValueStorePath, peers, ctx.user.id, id, chainId, 'org1', chain.get('type'), ctx.user.username);
      case 'instantiate': {
        const deployQuery = new ctx.Parse.Query(ctx.parse.SmartContractDeploy);
        deployQuery.include(['chain', 'smartContract', 'smartContractCode']);
        const deploy = await deployQuery.get(deployId);
        const smartContract = deploy.get('smartContract');
        const smartContractCode = deploy.get('smartContractCode');
        const result = await ctx.instantiateSmartContract(network, keyValueStorePath, config.default.channelName, deployId, functionName, args, 'org1', chain.get('type'), peers, ctx.user.username);
        const nsp = app.io.of('/');
        const msg = ctx.helper.parseMsg('instantiate-done', result, {
          chainName: chain.get('name'),
          codeName: smartContract.get('name'),
          codeVersion: smartContractCode.get('version'),
          chainId,
          deployId,
        });
        nsp.to(ctx.user.id).emit('instantiate-done', msg);
        break;
      }
      default:
        return {
          success: false,
          message: 'Please input deploy operation',
        };
    }
  }
}

module.exports = SmartContractService;
