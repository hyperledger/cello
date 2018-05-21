/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    let data = {
      webRoot: process.env.WEBROOT,
    };
    let userInfo = {};
    if (!ctx.isAuthenticated()) {
      userInfo = {
        id: '',
        username: '',
        authority: '',
      };
    } else {
      userInfo = {
        id: ctx.user.id,
        username: ctx.user.username,
        authority: ctx.user.role,
      };
    }
    data = {
      ...data,
      ...userInfo,
    };
    await ctx.render('index', data);
  }
  async logout() {
    this.ctx.logout();
    this.ctx.redirect(process.env.WEBROOT);
  }
}

module.exports = HomeController;
