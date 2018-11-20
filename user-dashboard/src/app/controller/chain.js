/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Controller = require('egg').Controller;

class ChainController extends Controller {
  async list() {
    const { ctx } = this;
    ctx.body = await ctx.service.chain.list();
  }
  async apply() {
    const { ctx } = this;
    ctx.validate({
      type: { type: 'string' },
      size: { type: 'int' },
      name: { type: 'string' },
    });
    const success = await ctx.service.chain.apply();
    ctx.status = success ? 200 : 400;
    ctx.body = {
      success,
    };
  }
  async release() {
    const { ctx } = this;
    ctx.service.chain.release();
    ctx.body = {
      success: true,
    };
  }
  async query() {
    const { ctx } = this;
    const chainId = ctx.params.id;
    const queryType = ctx.query.type;
    const blockNumber = ctx.query.blockNumber || '';
    const count = ctx.query.count || 10;
    if (!queryType) {
      ctx.status = 400;
      ctx.body = {
        error: 'Need query type',
      };
    } else {
      switch (queryType) {
        case 'summary': {
          const chain = await ctx.model.Chain.findOne({ _id: chainId });
          const network = await ctx.service.chain.generateNetwork(chainId, chain.type);
          const deploys = await ctx.model.SmartContractDeploy.find({ chain, status: 'instantiated' }, '_id name status deployTime').populate('smartContractCode smartContract', '_id version name description').sort('-deployTime')
            .limit(6);
          const operations = await ctx.model.Operation.find({ chain, user: ctx.user.id }).populate('smartContract smartContractCode', '_id version name').sort('-operateTime')
            .limit(10);
          if (!chain) {
            ctx.status = 400;
            ctx.body = {
              error: 'Can not find this chain',
            };
          }
          const queries = [
            await ctx.service.chain.getChannelHeight(chainId, chain.type),
            await ctx.service.chain.getRecentBlock(chainId, count, chain.type),
            await ctx.service.chain.getRecentTransactions(chainId, count, chain.type),
            await ctx.service.chain.getChannels(chainId, chain.type),
            await ctx.service.chain.getChainCodes(chainId, 'installed', chain.type),
            await ctx.service.chain.getChainCodes(chainId, 'instantiated', chain.type),
          ];
          const results = await queries;
          ctx.body = {
            success: true,
            height: results[0],
            recentBlock: results[1],
            recentTransaction: results[2],
            channels: results[3],
            installedChainCodes: results[4],
            instantiatedChainCodes: results[5],
            chain,
            network,
            deploys,
            operations,
          };
          break;
        }
        case 'channelHeight':
          ctx.body = {
            success: true,
            height: await ctx.service.chain.getChannelHeight(chainId),
          };
          break;
        case 'blockByNumber':
          if (blockNumber === '') {
            ctx.body = {
              success: false,
              message: 'Need block number',
            };
          } else {
            ctx.body = await ctx.service.chain.getBlockByNumber(chainId, blockNumber);
          }
          break;
        case 'recentBlock':
          ctx.body = await ctx.service.chain.getRecentBlock(chainId, count);
          break;
        case 'recentTransaction':
          ctx.body = await ctx.service.chain.getRecentTransactions(chainId, count);
          break;
        case 'status':
          break;
        case '':
          break;
        default:
          break;
      }
    }
  }
  async downloadNetworkConfig() {
    const { ctx } = this;
    const chainId = ctx.params.id;
    const chain = await ctx.model.Chain.findOne({ _id: chainId });
    const network = await ctx.service.chain.generateNetwork(chainId, chain.type);
    ctx.response.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename=${chainId}.json`,
    });
    ctx.body = {
      'network-config': network,
    };
  }
}

module.exports = ChainController;
