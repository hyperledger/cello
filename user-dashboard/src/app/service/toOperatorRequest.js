
'use strict';

const Service = require('egg').Service;

class RequestOperatorService extends Service {
    async getNetworks() {
        const { ctx } = this;
        const id = ctx.params.id;
        let orgResponse;
        let data;
        try {
            let orgUrl = `http://operator-dashboard:8071/v2/blockchain_networks`;
            if (id) {
                orgUrl += `/${id}`;
            }
            orgResponse = await ctx.curl(orgUrl, {
                method: 'GET',
            });
        } catch (e) {
            return {
                success: false,
                message: 'get networks infor fail'
            };
        }
        if (orgResponse.status === 200) {
            data = JSON.parse(orgResponse.data.toString());
        }
        return {
            success: true,
            data
        };
    }
    
    async getOrganizations() {
        const { ctx } = this;
        let orgResponse;
        let data;
        const id = ctx.params.id;
        try {
            let orgUrl = `http://operator-dashboard:8071/v2/organizations`;
            if (id) {
                orgUrl += `/${id}`;
            }
            orgResponse = await ctx.curl(orgUrl, {
                method: 'GET',
            });
        } catch (e) {
            return {
                success: false,
                message: 'get organizations infor fail'
            };
        }
        if (orgResponse.status === 200) {
            data = JSON.parse(orgResponse.data.toString());
        }
        return {
            success: true,
            data
        };
    }
    
    async orgAdminResetPassword() {
        const { ctx } = this;
        let orgResponse;
        let data;
        const id = ctx.params.id;
        
        if (!id) {
            return {
                success: false,
                message: 'The user\'s id is required.'
            };
        }
        const body = ctx.request.body;
        
        try {
            let orgUrl = `http://operator-dashboard:8071/api/user/${id}/changePassword`;
            orgResponse = await ctx.curl(orgUrl, {
                method: 'POST',
                data: body
            });
        } catch (e) {
            return {
                success: false,
                message: 'change password fail'
            };
        }
        if (orgResponse.status === 200) {
            data = JSON.parse(orgResponse.data.toString());
            return {
                success: true,
                data
            };
            
        }
        else {
            data = JSON.parse(orgResponse.data.toString());
            return {
                success: false,
                data
            };
            
        }
    }
}

module.exports = RequestOperatorService;
