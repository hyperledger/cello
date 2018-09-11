/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';
const rimraf = require('rimraf');

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const SmartContractSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String },
    description: { type: String },
    path: { type: String },
    createTime: { type: Date, default: Date.now },
    default: { type: Schema.Types.Mixed },
  });

  SmartContractSchema.post('remove', function(doc) {
    rimraf(doc.path, function() {
      app.logger.debug(`delete smart contract path ${doc.path}`);
    });
  });

  return mongoose.model('SmartContract', SmartContractSchema);
};
