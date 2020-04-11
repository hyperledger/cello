/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Controller = require('egg').Controller;

class UserController extends Controller {
    
    async getCookie() {
        const { ctx } = this;
        const user = ctx.request.body;
        const result = await ctx.service.user.getCookie(user);
        ctx.status = result.success ? 200:400;
        ctx.body = result;
    }
    
    async getToken() {
        const { ctx } = this;
        const user = ctx.request.body;
        const result = await ctx.service.user.getToken(user);
        ctx.status = result.success ? 200:400;
      ctx.body = result;
    }
    
    async currentUser() {
        const { ctx } = this;
        if (!ctx.isAuthenticated()) {
            ctx.status = 401;
        } else {
            ctx.body = this.ctx.user;
        }
    }
    
    async generateToken(){
        const { ctx,config } = this;
        const {networkId, userName, data, time} = ctx.request.body.user;
        const result = await ctx.service.user.generateToken(networkId, userName, data, time);
        ctx.status = result.success ? 200 : 400;
        ctx.body = result;
    }
    
    async createOrgUser() {
        const { ctx } = this;
        const { name, role, password, delegateRoles, affiliation, affiliationMgr, revoker, gencrl, SSOUser } = ctx.request.body.orguser;
        const result = await ctx.service.user.createOrguser(name, role, password, delegateRoles, affiliation, affiliationMgr, revoker, gencrl, SSOUser);
        ctx.status = result.success ? 200 : 400;
        ctx.body = result;
    }
    
    async setSSOUser() {
        const { ctx } = this;
        const { id, SSOUser } = ctx.request.body.setuser;
        const result = await ctx.service.user.setSSOUser( id, SSOUser );
        ctx.status = result.success ? 200 : 400;
        ctx.body = result;
    }
    
    async deleteOrgUser() {
        const { ctx } = this;
        const name = ctx.req.query.name;
        const reason = ctx.req.query.reason;
        const success = await ctx.service.user.deleteOrguser(name, reason);
        ctx.status = success ? 200 : 400;
    }
    
    async getOrgUser() {
        const { ctx } = this;
        const name = ctx.params.name;
        const user = await ctx.service.user.getOrguser(name);
        ctx.status = user.success ? 200 : 400;
        ctx.body = user;
    }
    
    async getOrgUserList() {
        const { ctx } = this;
        const user = await ctx.service.user.getOrguserList();
        ctx.status = user.success ? 200 : 400;
        ctx.body = user;
    }
    
    async updateOrguserState() {
        const { ctx } = this;
        const name = ctx.params.name;
        const active = ctx.req.query.active;
        let result = { success: false };
        result = await ctx.service.user.updateOrguserState(name, active);
        ctx.status = result.success ? 200 : 400;
        ctx.body = result;
    }
    
    async updateOrguserPassword() {
        const { ctx } = this;
        const password = ctx.req.query.password;
        const old_password = ctx.req.query.old_password;
        let result = { success: false };
        result = await ctx.service.user.updateOrguserPassword(old_password, password);
        ctx.status = result.success ? 200 : 400;
        ctx.body = result;
    }
    
    async resetOrguserPassword(){
        const { ctx } = this;
        const name = ctx.params.name;
        const newPassword = ctx.request.body.password;
        const curPassword = ctx.request.body.curPassword;
        let result = await ctx.service.user.resetOrguserPassword(curPassword, name, newPassword);
        ctx.status = result.success ? 200 : 400;
        ctx.body = result;
    }
    
    async updateOrguserInfo() {
        const { ctx } = this;
        const information = ctx.request.body.information;
        let result = await ctx.service.user.updateOrguserInfo(information);
        ctx.status = result.success ? 200 : 400;
        ctx.body = result;
    }
    
    async reenrollOrgUser() {
        const { ctx } = this;
        const name = ctx.params.name;
        const result = await ctx.service.user.reenrollOrgUser(name);
        ctx.status = result.success ? 200 : 400;
        ctx.body = result;
    }
    
    async createAffiliation() {
        const { ctx } = this;
        const { name } = ctx.request.body;
        const result = await ctx.service.user.createAffiliation(name);
        ctx.status = result.success ? 200 : 400;
        ctx.body = result;
    }
    
    async getAffiliations() {
        const { ctx } = this;
        const result = await this.ctx.service.user.getAffiliations();
        ctx.status = result.success ? 200 : 400;
        ctx.body = result;
    }
    
    async delAffiliation() {
        const { ctx } = this;
        const result = await ctx.service.user.delAffiliation();
        ctx.status = result.success ? 200 : 400;
        ctx.body = result;
    }
    
    async updateAffiliation() {
        const { ctx } = this;
        const { sourceName, targetName } = ctx.request.body.affiliation;
        const result = await ctx.service.user.updateAffiliation(sourceName, targetName);
        ctx.status = result.success ? 200 : 400;
        ctx.body = result;
    }
    
    async deleteMongoDatasByNetworkid(){
        const { ctx } = this;
        const blockchain_network_id  = ctx.request.body.blockchain_network_id;
        const result = await ctx.service.user.deleteMongoDatasByNetworkid(blockchain_network_id);
        ctx.status = result.success ? 200 : 400;
        ctx.body = result;
    }
}

module.exports = UserController;
