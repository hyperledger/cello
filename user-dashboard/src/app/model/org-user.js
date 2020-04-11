'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const OrgUserSchema = new Schema({
    username: { type: String },
    password: { type: String },
    active: { type: String },
    ancestors: { type: String },
    orgname: { type: String },
    network_id: { type: String },
    roles: { type: String },
    delegate_roles: { type: String },
    affiliation_mgr: { type: String },
    revoker: { type: String },
    gencrl: { type: String },
    create_time: { type: Date },
    information: { type: Array },
    expiration_date: { type: String },
    caVersion: { type: String },
    SSOUser: {type: String}
  });

  return mongoose.model('OrgUser', OrgUserSchema);
};
