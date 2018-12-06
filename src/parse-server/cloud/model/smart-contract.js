/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Parse = require('parse/node');
const rimraf = require('rimraf');

Parse.Cloud.afterDelete("SmartContract", (request) => {
  // remove related smart contract code
  const smartContractCodeQuery = new Parse.Query("SmartContractCode");
  smartContractCodeQuery.equalTo("smartContract", request.object);
  smartContractCodeQuery.find()
    .then(Parse.Object.destroyAll)
    .catch((error) => {
      console.error("Error finding related smart contract code " + error.code + ": " + error.message);
    });

  // remove related smart contract operate history
  const smartContractOperateHistoryQuery = new Parse.Query("SmartContractOperateHistory");
  smartContractOperateHistoryQuery.equalTo("smartContract", request.object);
  smartContractOperateHistoryQuery.find()
    .then(Parse.Object.destroyAll)
    .catch((error) => {
      console.error("Error finding related smart contract operate history " + error.code + ": " + error.message);
    });

  rimraf(request.object.get('path'), function() {
    console.log(`delete smart contract path ${request.object.get('path')}`);
  });
});
