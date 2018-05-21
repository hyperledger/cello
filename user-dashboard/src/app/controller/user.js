/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Controller = require('egg').Controller;

class UserController extends Controller {
  async currentUser() {
    const { ctx } = this;
    if (!ctx.isAuthenticated()) {
      ctx.status = 401;
    } else {
      ctx.body = this.ctx.user;
    }
  }
}

module.exports = UserController;
