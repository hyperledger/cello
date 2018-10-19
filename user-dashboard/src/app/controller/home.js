/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    if (!ctx.isAuthenticated()) {
      ctx.redirect(`${process.env.WEBROOT}passport/oauth2`);
    } else {
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
  }
  async logout() {
    const logoutUrl = `http://${process.env.SERVER_PUBLIC_IP}:${process.env.KEYCLOAK_SERVER_PORT}/auth/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`;
    const redirectUrl = `http://${process.env.SERVER_PUBLIC_IP}:8081`;
    this.ctx.logout();
    this.ctx.redirect(`${logoutUrl}?redirect_uri=${redirectUrl}`);
  }
}

module.exports = HomeController;
