/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const SmartContractOperateHistorySchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    smartContract: { type: Schema.Types.ObjectId, ref: 'SmartContract' },
    smartContractCode: { type: Schema.Types.ObjectId, ref: 'SmartContractCode' },
    chain: { type: Schema.Types.ObjectId, ref: 'Chain' },
    operate: { type: String, enum: ['new', 'deploy', 'delete-code'] },
    status: { type: String, default: 'success', enum: ['success', 'failed'] },
    operateTime: { type: Date, default: Date.now },
  });

  return mongoose.model('SmartContractOperateHistory', SmartContractOperateHistorySchema);
};
