/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  app.router.get('/api/currentUser', app.controller.user.currentUser);
  app.router.get('/api/chain', app.controller.chain.list);
  app.router.post('/api/chain', app.controller.chain.apply);
  app.router.get('/api/chain/:id', app.controller.chain.query);
  app.router.get('/api/chain/network-config/:id', app.controller.chain.downloadNetworkConfig);
  app.router.delete('/api/chain/:id', app.controller.chain.release);
};
