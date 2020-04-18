/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const ServiceEndpointSchema = new Schema({
    networkid: { type: String },
    channel: { type: Schema.Types.ObjectId, ref: 'channel' },
    org_config_name: { type: String },
    org_config_mspid: { type: String },
    service_name: { type: String },
    service_type: { type: String },
    service_ip: { type: String },
    grpc: { type: String },
    event: { type: String },
    service_port: { type: String },
  });

  return mongoose.model('ServiceEndpoint', ServiceEndpointSchema);
};
