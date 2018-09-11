/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Service = require('egg').Service;
const ObjectID = require('mongodb').ObjectID;
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
    return await ctx.model.SmartContract.find({ user: ctx.user.id });
  }
  async copySystemSmartContract(userId) {
    const { ctx, config } = this;
    const smartContractRootDir = `${config.dataDir}/${userId}/smart_contract`;
    for (const networkType in config.default.smartContracts) {
      const networkSmartContract = config.default.smartContracts[networkType];
      for (const idx in networkSmartContract) {
        const smartContractId = new ObjectID();
        const smartContract = networkSmartContract[idx];
        const smartContractPath = `${smartContractRootDir}/${smartContractId}`;
        const smartContractCodePath = `${smartContractRootDir}/${smartContractId}/${smartContract.version}`;
        fs.ensureDirSync(smartContractCodePath);
        shell.cp('-R', `${smartContract.path}/*`, smartContractCodePath);
        await ctx.model.SmartContract.create({
          _id: smartContractId,
          name: smartContract.name,
          description: smartContract.description,
          path: smartContractPath,
          default: smartContract.default,
          user: userId,
        });
        await ctx.model.SmartContractCode.create({
          smartContract: smartContractId,
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
    const smartContractId = id || new ObjectID();
    const targetFileName = `${smartContractId}${path.extname(stream.filename)}`;
    const smartContractPath = `${smartContractRootDir}/${smartContractId}`;
    const smartContractCodePath = `${smartContractRootDir}/${smartContractId}/tmp`;
    const zipFile = path.join(smartContractPath, targetFileName);
    fs.ensureDirSync(smartContractCodePath);
    const writeStream = fs.createWriteStream(zipFile);
    try {
      await awaitWriteStream(stream.pipe(writeStream));
    } catch (err) {
      await sendToWormhole(stream);
      return {
        success: false,
      };
    }
    const zip = AdmZip(zipFile);
    zip.extractAllTo(smartContractCodePath, true);
    commonFs.unlinkSync(zipFile);
    if (!id) {
      await ctx.model.SmartContract.create({
        _id: smartContractId,
        path: smartContractPath,
        user: ctx.user.id,
      });
    }
    const smartContractCode = await ctx.model.SmartContractCode.create({
      smartContract: smartContractId,
      path: smartContractCodePath,
    });
    return {
      id: smartContractCode._id.toString(),
      success: true,
    };
  }
  async removeSmartContractCode(id) {
    const { ctx } = this;
    const smartContractCode = await ctx.model.SmartContractCode.findOne({ _id: id }).populate('smartContract');
    if (smartContractCode) {
      await smartContractCode.remove();
      if (smartContractCode.smartContract) {
        const codeCount = await ctx.model.SmartContractCode.count({ smartContract: smartContractCode.smartContract });
        if (codeCount === 0) {
          await smartContractCode.smartContract.remove();
        }
      }
    }
  }
  async updateSmartContractCode(id) {
    const { ctx } = this;
    const smartContractCode = await ctx.model.SmartContractCode.findOne({ _id: id }).populate('smartContract');
    if (!smartContractCode || !smartContractCode.smartContract) {
      return {
        success: false,
      };
    }
    const smartContract = smartContractCode.smartContract;
    const version = ctx.request.body.version || smartContractCode.version;
    const description = ctx.request.body.description || smartContract.description;
    const smartContractPath = smartContractCode.smartContract.path;
    const name = ctx.request.body.name || smartContract.name;
    const smartContractCodePath = `${smartContractPath}/${version}`;
    if (smartContractCodePath !== smartContractCode.path) {
      fs.ensureDirSync(smartContractCodePath);
      await shell.cp('-R', `${smartContractCode.path}/*`, smartContractCodePath);
      rimraf(smartContractCode.path, function() {
        ctx.logger.debug(`delete smart contract path ${smartContractCode.path}`);
      });
    }
    smartContractCode.path = smartContractCodePath;
    smartContractCode.version = version;
    await smartContractCode.save();
    smartContract.name = name;
    smartContract.description = description;
    await smartContract.save();
    await ctx.model.SmartContractOperateHistory.create({
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
    const smartContract = await ctx.model.SmartContract.findOne({ _id: id });
    const codes = await ctx.model.SmartContractCode.find({ smartContract });
    for (const idx in codes) {
      await codes[idx].remove();
    }
    await smartContract.remove();
  }
  async querySmartContract(id) {
    const { ctx } = this;
    const smartContract = await ctx.model.SmartContract.findOne({ _id: id }, '_id description name createTime default');
    if (!smartContract) {
      return {
        success: false,
      };
    }
    const codes = await ctx.model.SmartContractCode.find({ smartContract }, '_id version createTime').sort('-createTime');
    const newOperations = await ctx.model.SmartContractOperateHistory.find({ smartContract }, '_id operateTime status').populate('smartContractCode', 'version').sort('-operateTime');
    const deploys = await ctx.model.SmartContractDeploy.find({ smartContract }, '_id name status deployTime').populate('smartContractCode chain', '_id version name chainId type size').sort('-deployTime');
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
    const chain = await ctx.model.Chain.findOne({ _id: chainId });
    const network = await ctx.service.chain.generateNetwork(chainId, chain.type);
    let peers = ['peer1', 'peer2'];
    switch (chain.type) {
      case 'fabric-1.2':
        peers = ['peer0.org1.example.com', 'peer1.org1.example.com'];
        break;
      default:
        break;
    }
    switch (operation) {
      case 'install':
        return await ctx.installSmartContract(network, keyValueStorePath, peers, ctx.user.id, id, chainId, 'org1', chain.type, ctx.user.username);
      case 'instantiate': {
        const deploy = await ctx.model.SmartContractDeploy.findOne({ _id: deployId }).populate('chain smartContract smartContractCode');
        const result = await ctx.instantiateSmartContract(network, keyValueStorePath, config.default.channelName, deployId, functionName, args, 'org1', chain.type, peers, ctx.user.username);
        const nsp = app.io.of('/');
        const msg = ctx.helper.parseMsg('instantiate-done', result, {
          chainName: deploy.chain.name,
          codeName: deploy.smartContract.name,
          codeVersion: deploy.smartContractCode.version,
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
