/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Parse = require('parse/node');
const rimraf = require('rimraf');

Parse.Cloud.afterDelete("SmartContractCode", async (request) => {
  // remove related smart contract code
  const smartContractCodeQuery = new Parse.Query("SmartContractCode");
  const smartContract = request.object.get('smartContract');
  if (smartContract) {
    smartContractCodeQuery.equalTo("smartContract", smartContract);
    const smartContractCodeCount = await smartContractCodeQuery.count();
    if (smartContractCodeCount === 0) {
      try {
        await smartContract.destroy();
      } catch (e) {
        console.error('smart contract have been deleted ', e.code + ': ' + e.message);
      }
    }
  }

  rimraf(request.object.get('path'), function() {
    console.log(`delete smart contract path ${request.object.get('path')}`);
  });
});
