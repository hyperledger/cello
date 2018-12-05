/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  const { Parse } = app;

  class SmartContract extends Parse.Object {
    constructor() {
      super('SmartContract');
    }
  }

  Parse.Object.registerSubclass('SmartContract', SmartContract);

  return SmartContract;
};
