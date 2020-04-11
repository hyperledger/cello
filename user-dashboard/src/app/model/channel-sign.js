/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const ChannelSchema = new Schema({
    channelid: { type: String },
    orgid: { type: String },
    signatures: { type: Array },
    signers: { type: Array }
  });

  return mongoose.model('ChannelSign', ChannelSchema);
};
