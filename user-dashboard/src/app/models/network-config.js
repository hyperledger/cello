/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  const { Parse } = app;
  class NetworkConfig extends Parse.Object {
    constructor() {
      super('NetworkConfig');
    }

    storeServiceUrl(config) {
      return Parse.Cloud.run('storeServiceUrl', {
        chainId: this.get('chain').id,
        networkConfigId: this.id,
        config,
      });
    }
  }

  Parse.Object.registerSubclass('NetworkConfig', NetworkConfig);

  return NetworkConfig;
};
