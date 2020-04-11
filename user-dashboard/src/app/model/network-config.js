'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const NetworkConfigSchema = new Schema({
    id: {type: String},
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    channel: { type: Schema.Types.ObjectId, ref: 'channel' },
  });

  return mongoose.model('NetworkConfig', NetworkConfigSchema);
};
