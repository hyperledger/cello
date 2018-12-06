/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';
const Controller = require('egg').Controller;

class NspController extends Controller {
  async join() {
    const { ctx, app } = this;
    const message = ctx.args[0] || {};

    try {
      const { id } = message;
      ctx.socket.join(id);
    } catch (error) {
      app.logger.error(error);
    }
  }
}

module.exports = NspController;
