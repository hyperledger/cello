/*
 SPDX-License-Identifier: Apache-2.0
 author: tianmingming
*/
'use strict';

const Controller = require('egg').Controller;

class ChainCodeController extends Controller {
    async upload() {
        const { ctx } = this;
        const stream = await ctx.getFileStream();
        // put fields here is ok, put fields in service is also ok
        // consider later
        const fields = stream.fields;
        const result = await ctx.service.chainCode.storeChainCode(stream, fields);
        ctx.status = result.success ? 200 : 400;
        ctx.body = result;
    }
    
    async getChainCodes() {
        const { ctx } = this;
        ctx.body = await ctx.service.chainCode.getChainCodes();
    }
    
    async getChainCodeById() {
        const { ctx } = this;
        ctx.body = await ctx.service.chainCode.getChainCodeById();
    }
    
    async installChainCode() {
        const { ctx } = this;
        
        const result = await ctx.service.chainCode.installChainCode();
        ctx.status = result.success ? 200 : 400;
        ctx.body = result;
    }
    
    async instantiateChainCode() {
        const { ctx } = this;
        
        const result = await ctx.service.chainCode.instantiateChainCode();
        ctx.status = result.success ? 200 : 400;
        ctx.body = result;
    }
    
    async upgradeChainCode() {
        const { ctx } = this;
        
        const result = await ctx.service.chainCode.upgradeChainCode();
        ctx.status = result.success ? 200 : 400;
        ctx.body = result;
    }
    
    async deleteChainCodeById() {
        const { ctx } = this;
        const result = await ctx.service.chainCode.deleteChainCodeById();
        ctx.status = result.success ? 200 : 400;
        ctx.body = result;
    }
    
}

module.exports = ChainCodeController;
