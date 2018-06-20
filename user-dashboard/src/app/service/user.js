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
    const username = user.username;
    const password = user.password;
    const response = await ctx.curl(loginUrl, {
      method: 'POST',
      data: {
        username,
        password,
      },
      dataType: 'json',
    });
    if (response.status === 200) {
      const userModel = await ctx.model.User.findOne({ username });
      if (!userModel) {
        await ctx.service.smartContract.copySystemSmartContract(response.data.id);
        await ctx.model.User.create({
          _id: response.data.id,
          username,
        });
      }
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
