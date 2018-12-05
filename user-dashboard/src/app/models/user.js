/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  const { Parse } = app;

  class User extends Parse.Object {
    constructor() {
      super('User');
    }
  }

  Parse.Object.registerSubclass('User', User);

  return User;
};
