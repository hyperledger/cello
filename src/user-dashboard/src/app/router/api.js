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
  app.router.get('/api/smart-contract', app.controller.smartContract.list);
  app.router.delete('/api/smart-contract/code/:id', app.controller.smartContract.removeSmartContractCode);
  app.router.put('/api/smart-contract/code/:id', app.controller.smartContract.updateSmartContractCode);
  app.router.delete('/api/smart-contract/:id', app.controller.smartContract.deleteSmartContract);
  app.router.get('/api/smart-contract/:id', app.controller.smartContract.querySmartContract);
  app.router.post('/api/smart-contract/deploy-code/:id', app.controller.smartContract.deploySmartContractCode);
  app.router.get('/api/deploy', app.controller.deploy.list);
  app.router.get('/api/deploy/:id', app.controller.deploy.query);
  app.router.post('/api/deploy/operate/:id', app.controller.deploy.operate);
};
