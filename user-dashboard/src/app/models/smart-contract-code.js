/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  const { Parse } = app;

  class SmartContractCode extends Parse.Object {
    constructor() {
      super('SmartContractCode');
    }
  }

  Parse.Object.registerSubclass('SmartContractCode', SmartContractCode);

  return SmartContractCode;
};
