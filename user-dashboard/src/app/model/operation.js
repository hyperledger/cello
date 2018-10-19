/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  require('mongoose-uuid2')(mongoose);
  const UUID = mongoose.Types.UUID;

  const OperationSchema = new Schema({
    user: { type: UUID, ref: 'User' },
    smartContract: { type: Schema.Types.ObjectId, ref: 'SmartContract' },
    smartContractCode: { type: Schema.Types.ObjectId, ref: 'SmartContractCode' },
    deploy: { type: Schema.Types.ObjectId, ref: 'SmartContractDeploy' },
    chain: { type: Schema.Types.ObjectId, ref: 'Chain' },
    operate: { type: String },
    success: { type: Boolean, default: true },
    error: { type: String },
    fcn: { type: String },
    arguments: { type: String },
    result: { type: String },
    operateTime: { type: Date, default: Date.now },
  });

  return mongoose.model('Operation', OperationSchema);
};
