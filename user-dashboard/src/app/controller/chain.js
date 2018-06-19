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
    const queryType = ctx.query.type;
    if (!queryType) {
      ctx.status = 400;
      ctx.body = {
        error: 'Need query type',
      };
    } else {
      switch (queryType) {
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
    const network = await ctx.service.chain.generateNetwork(chainId);
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
