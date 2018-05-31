'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const OrgConfigSchema = new Schema({
    networkConfig: { type: Schema.Types.ObjectId, ref: 'NetworkConfig' },
    name: { type: String },
    mspid: { type: String },
    admin: { type: Schema.Types.Mixed },
    sequence: { type: Number },
  });

  OrgConfigSchema.statics.findOneOrCreate = async function findOneOrCreate(condition, doc) {
    const org = await this.findOne(condition);
    return org || this.create(doc);
  };

  return mongoose.model('OrgConfig', OrgConfigSchema);
};
