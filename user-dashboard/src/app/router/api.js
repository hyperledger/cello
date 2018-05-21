/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  app.router.get('/api/currentUser', app.controller.user.currentUser);
};
