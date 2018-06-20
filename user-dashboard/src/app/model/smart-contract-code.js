/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';
const rimraf = require('rimraf');

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const SmartContractCodeSchema = new Schema({
    smartContract: { type: Schema.Types.ObjectId, ref: 'SmartContract' },
    version: { type: String },
    path: { type: String },
    createTime: { type: Date, default: Date.now },
  });

  SmartContractCodeSchema.post('remove', function(doc) {
    rimraf(doc.path, function() {
      app.logger.debug(`delete code path ${doc.path}`);
    });
  });

  return mongoose.model('SmartContractCode', SmartContractCodeSchema);
};
