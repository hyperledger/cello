/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Controller = require('egg').Controller;

class DeployController extends Controller {
  async list() {
    const { ctx } = this;
    ctx.body = {
      data: await ctx.service.deploy.list(),
    };
  }
  async query() {
    const { ctx } = this;
    const id = ctx.params.id;
    ctx.body = await ctx.service.deploy.query(id);
  }
  async operate() {
    const { ctx } = this;
    const id = ctx.params.id;
    const { functionName, operation } = ctx.request.body;
    let { args } = ctx.request.body;
    args = args.split(',');
    switch (operation) {
      case 'invoke':
        ctx.body = await ctx.service.deploy.invoke(functionName, args, id);
        break;
      case 'query':
        ctx.body = await ctx.service.deploy.queryChainCode(functionName, args, id);
        break;
      default:
        ctx.body = {
          success: false,
          message: 'Must input valid operation',
        };
        break;
    }
  }
}

module.exports = DeployController;
