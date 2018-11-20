'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  require('mongoose-uuid2')(mongoose);
  const UUID = mongoose.Types.UUID;

  const NetworkConfigSchema = new Schema({
    user: { type: UUID, ref: 'User' },
    chain: { type: Schema.Types.ObjectId, ref: 'Chain' },
  });

  return mongoose.model('NetworkConfig', NetworkConfigSchema);
};
