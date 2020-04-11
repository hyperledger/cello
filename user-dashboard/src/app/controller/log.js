/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Controller = require('egg').Controller;

class LogController extends Controller {
    async fetch() {
        const { ctx } = this;
        const logs = await ctx.service.log.fetch();
        ctx.status = logs.success ? 200 : 400;
        ctx.body = logs;
    }
    
    async deposit() {
        const { ctx } = this;
        const { opName, opObject, opSource, opResult, operator, opDate } = ctx.request.body.operator_log;
        const result = await ctx.service.log.deposit(opName, opObject, opSource, opResult, operator, opDate);
        ctx.status = result ? 200 : 400;
    }
}


module.exports = LogController;
