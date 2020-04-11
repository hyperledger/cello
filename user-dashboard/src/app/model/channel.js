/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const ChannelSchema = new Schema({
    name: { type: String },
    description: { type: String },
    orderer_url: { type: String },
    peer_orgsName: { type: Array },
    creator_id: { type: String },
    creator_name: { type: String },
    version: { type: String },
    blockchain_network_id: { type: String },
    peers_inChannel: { type: Array },
    date: { type: Date },
  });

  return mongoose.model('Channel', ChannelSchema);
};
