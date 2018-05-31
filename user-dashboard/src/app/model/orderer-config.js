'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const OrdererConfigSchema = new Schema({
    networkConfig: { type: Schema.Types.ObjectId, ref: 'NetworkConfig' },
    url: { type: String },
    serverHostName: { type: String, default: 'orderer.example.com' },
    tlsCaCerts: { type: String },
  });

  return mongoose.model('OrdererConfig', OrdererConfigSchema);
};
