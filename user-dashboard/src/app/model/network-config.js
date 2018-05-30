'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const NetworkConfigSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    chain: { type: Schema.Types.ObjectId, ref: 'Chain' },
  });

  return mongoose.model('NetworkConfig', NetworkConfigSchema);
};
