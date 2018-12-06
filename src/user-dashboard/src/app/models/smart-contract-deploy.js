/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  const { Parse } = app;

  class SmartContractDeploy extends Parse.Object {
    constructor() {
      super('SmartContractDeploy');
    }
  }

  Parse.Object.registerSubclass('SmartContractDeploy', SmartContractDeploy);

  return SmartContractDeploy;
};
