/*
 SPDX-License-Identifier: Apache-2.0
 author: tianmingming
*/
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ChainCodeSchema = new Schema({
    name: { type: String },
    version: { type: String },
    description: { type: String },
    language: { type: String },
    // status: { type: String },
    creator_id: { type: Schema.Types.ObjectId, ref: 'User' },
    creator_name: { type: String },
    // channel_id: { type: Schema.Types.ObjectId, ref: 'Channel' },
    channel_ids: { type: Array },
    peers: { type: Array },
    blockchain_network_id: { type: String },
    create_ts: { type: Date },
    install_times: { type: Number, default: 0 },
    md5: { type: String },
  });

  return mongoose.model('ChainCode', ChainCodeSchema);
};

