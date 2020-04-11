'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const PeerConfigSchema = new Schema({
    orgConfig: { type: Schema.Types.ObjectId, ref: 'OrgConfig' },
    networkConfig: { type: Schema.Types.ObjectId, ref: 'NetworkConfig' },
    grpc: { type: String },
    event: { type: String },
    domain:{ type: String },
    serverHostName: { type: String },
    sequence: { type: Number },
    tlsCaCerts: { type: Schema.Types.Mixed },
  });

  return mongoose.model('PeerConfig', PeerConfigSchema);
};
