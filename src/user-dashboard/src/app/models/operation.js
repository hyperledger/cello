/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  const { Parse } = app;

  class Operation extends Parse.Object {
    constructor() {
      super('Operation');
    }
  }

  Parse.Object.registerSubclass('Operation', Operation);

  return Operation;
};
