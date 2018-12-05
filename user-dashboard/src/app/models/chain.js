/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  const { config, Parse } = app;

  class Chain extends Parse.Object {
    constructor() {
      super('Chain');
    }

    generateNetwork() {
      return Parse.Cloud.run('generateNetwork', {
        id: this.id,
        config: {
          dataDir: config.dataDir,
          defaultChannelName: config.default.channelName,
        },
      });
    }
  }

  Parse.Object.registerSubclass('Chain', Chain);

  return Chain;
};
