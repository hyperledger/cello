/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
    async index() {
        const { ctx } = this;
        let data = {
            webRoot: '/',
        };
        let userInfo = {};
        if (!ctx.isAuthenticated()) {
            userInfo = {
                id: '',
                username: '',
                authority: '',
                networkid: '',
            };
        } else {
            userInfo = {
                id: ctx.user.id,
                username: ctx.user.username,
                authority: ctx.user.role,
                networkid: ctx.user.networkid,
            };
        }
        const token = await ctx.service.user.generateToken(userInfo);
        userInfo.token = token;
        data = {
            ...data,
            ...userInfo,
        };
        await ctx.render('index', data);
    }
    // async login(){
    //     const { ctx } = this;
    //     const data = ctx.request.body;
    //     const token = await ctx.service.user.generateToken(data);
    //     const userInfo = await ctx.service.user.login(data);
    //     let result = {};
    //     result.token = token;
    //     result.user = userInfo;
    //     console.log("result:",result);
    //     //ctx.login(userInfo);
    //     return result;
    // }
    async logout() {
        this.ctx.logout();
        this.ctx.redirect('/');
    }
}

module.exports = HomeController;
