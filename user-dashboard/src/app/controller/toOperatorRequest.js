/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Controller = require('egg').Controller;

class RequestOperatorController extends Controller {
    async getNetworks() {
        const { ctx } = this;
        
        const result = await ctx.service.toOperatorRequest.getNetworks();
        ctx.status = result.success ? 200 : 400;
        ctx.body = result.success ? result.data : result.message;
    }
    async getOrganizations() {
        const { ctx } = this;
        
        const result = await ctx.service.toOperatorRequest.getOrganizations();
        ctx.status = result.success ? 200 : 400;
        ctx.body = result.success ? result.data : result.message;
    }
    async orgAdminResetPassword() {
        const { ctx } = this;
        
        const result = await ctx.service.toOperatorRequest.orgAdminResetPassword();
        ctx.status = result.success ? 200 : 400;
        ctx.body = result.success ? result.data : result.message;
    }
}

module.exports = RequestOperatorController;
