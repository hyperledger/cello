/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  require('mongoose-uuid2')(mongoose);
  const UUID = mongoose.Types.UUID;

  const ChainSchema = new Schema({
    user: { type: UUID, ref: 'User' },
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
