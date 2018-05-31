/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const CaConfigSchema = new Schema({
    networkConfig: { type: Schema.Types.ObjectId, ref: 'NetworkConfig' },
    address: { type: String },
    sequence: { type: Number },
  });

  return mongoose.model('CaConfig', CaConfigSchema);
};
