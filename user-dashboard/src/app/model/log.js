'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const LogSchema = new Schema({
    opName: { type: String },
    opObject: { type: String },
    opSource: { type: String },
    opResult: { type: Schema.Types.Mixed },
    operator: { type: String },
    opDate: { type: Date },
    opDetails: { type: Schema.Types.Mixed },
  });

  return mongoose.model('Log', LogSchema);
};
