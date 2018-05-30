/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const ChainCodeSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    chain: { type: Schema.Types.ObjectId, ref: 'Chain' },
    name: { type: String },
  });

  return mongoose.model('ChainCode', ChainCodeSchema);
};
