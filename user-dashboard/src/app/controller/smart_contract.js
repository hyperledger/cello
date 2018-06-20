/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Controller = require('egg').Controller;

class SmartContractController extends Controller {
  async list() {
    const { ctx } = this;
    ctx.body = {
      data: await ctx.service.smartContract.list(),
    };
  }
  async upload() {
    const { ctx } = this;
    const stream = await ctx.getFileStream();
    ctx.body = await ctx.service.smartContract.storeSmartContract(stream);
  }
  async removeSmartContractCode() {
    const { ctx } = this;
    const id = ctx.params.id;
    await ctx.service.smartContract.removeSmartContractCode(id);
    ctx.status = 204;
  }
  async updateSmartContractCode() {
    const { ctx } = this;
    const id = ctx.params.id;
    ctx.body = await ctx.service.smartContract.updateSmartContractCode(id);
  }
  async deleteSmartContract() {
    const { ctx } = this;
    const id = ctx.params.id;
    await ctx.service.smartContract.deleteSmartContract(id);
    ctx.status = 204;
  }
}

module.exports = SmartContractController;
