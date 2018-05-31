/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const ChainSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    chainId: { type: String },
    serviceUrl: { type: Schema.Types.Mixed },
    size: { type: Number },
    type: { type: String },
    name: { type: String },
    initialized: { type: Boolean, default: false },
    config: { type: Schema.Types.Mixed },
    applyTime: { type: Date, default: Date.now },
  });

  return mongoose.model('Chain', ChainSchema);
};
