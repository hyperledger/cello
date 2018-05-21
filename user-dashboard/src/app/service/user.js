/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Service = require('egg').Service;
const roles = ['admin', 'operator', 'user'];

class UserService extends Service {
  async login(user) {
    const { config, ctx } = this;
    const loginUrl = config.operator.url.login;
    ctx.logger.debug('login url ', loginUrl);
    const response = await ctx.curl(loginUrl, {
      method: 'POST',
      data: {
        username: user.username,
        password: user.password,
      },
      dataType: 'json',
    });
    if (response.status === 200) {
      return {
        username: user.username,
        id: response.data.id,
        role: roles[response.data.role],
      };
    }
    return null;

  }
}

module.exports = UserService;
