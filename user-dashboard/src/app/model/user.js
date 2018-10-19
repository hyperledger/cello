'use strict';
const uuid = require('node-uuid');

module.exports = app => {
  const mongoose = app.mongoose;
  require('mongoose-uuid2')(mongoose);
  const UUID = mongoose.Types.UUID;
  const Schema = mongoose.Schema;

  const UserSchema = new Schema({
    _id: { type: UUID, default: uuid.v4 },
    username: { type: String },
  }, { id: false });

  return mongoose.model('User', UserSchema);
};
