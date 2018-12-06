/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Parse = require('parse/node');

Parse.Cloud.afterDelete('Chain', async (request) => {
  const queryNetworkConfig = new Parse.Query('NetworkConfig');
  queryNetworkConfig.equalTo('chain', request.object);
  const networkConfig = await queryNetworkConfig.first();

  // remove related ca config
  const caConfigQuery = new Parse.Query('CaConfig');
  caConfigQuery.equalTo("networkConfig", networkConfig);
  caConfigQuery.find().then(Parse.Object.destroyAll)
    .catch((error) => {
      console.error("Error delete related ca config" + error.code + ": " + error.message);
    });

  // remove related orderer config
  const ordererConfigQuery = new Parse.Query('OrdererConfig');
  ordererConfigQuery.equalTo("networkConfig", networkConfig);
  ordererConfigQuery.find().then(Parse.Object.destroyAll)
    .catch((error) => {
      console.error("Error delete related orderer config" + error.code + ": " + error.message);
    });

  // remove related peer config
  const peerConfigQuery = new Parse.Query('PeerConfig');
  peerConfigQuery.equalTo("networkConfig", networkConfig);
  peerConfigQuery.find().then(Parse.Object.destroyAll)
    .catch((error) => {
      console.error("Error delete related peer config" + error.code + ": " + error.message);
    });

  // remove related org config
  const orgConfigQuery = new Parse.Query('OrgConfig');
  orgConfigQuery.equalTo("networkConfig", networkConfig);
  orgConfigQuery.find().then(Parse.Object.destroyAll)
    .catch((error) => {
      console.error("Error delete related org config" + error.code + ": " + error.message);
    });

  // remove related network config
  await networkConfig.destroy();

  // remove related operations
  const operationQuery = new Parse.Query('Operation');
  operationQuery.equalTo('chain', request.object);
  operationQuery.find().then(Parse.Object.destroyAll)
    .catch((error) => {
      console.error("Error delete related operation" + error.code + ": " + error.message);
    });

  // remove related deployment
  const deployQuery = new Parse.Query('SmartContractDeploy');
  deployQuery.equalTo('chain', request.object);
  deployQuery.find().then(Parse.Object.destroyAll)
    .catch((error) => {
      console.error("Error delete related deploy " + error.code + ": " + error.message);
    });
});
