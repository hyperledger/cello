/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  const { Parse } = app;

  class SmartContractOperateHistory extends Parse.Object {
    constructor() {
      super('SmartContractOperateHistory');
    }
  }

  Parse.Object.registerSubclass('SmartContractOperateHistory', SmartContractOperateHistory);

  return SmartContractOperateHistory;
};
