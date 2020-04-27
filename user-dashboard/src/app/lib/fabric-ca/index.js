'use strict';

module.exports = app => {

  async function enrollAdmin(caHost, caPort, mspId, caStorePath, caDockerStorePath, userName, networkType = 'ca_v1.1') {
    return await app.enrollAdminV1_4(caHost, caPort, mspId, caStorePath);
  }

  async function registerUser(registerUser, ca, mspId, name, role, userAffilication, caStorePath, caDockerStorePath, attributes, networkType = 'ca_v1.1') {
    return await app.registerUserV1_4(registerUser, ca, mspId, name, role, userAffilication, caStorePath, attributes);
  }

  async function deleteUser(registerUser, name, reason, caHost, caPort, caStorePath, caDockerStorePath, networkType = 'ca_v1.1') {
    return await app.deleteUserV1_4(registerUser, name, reason, caHost, caPort, caStorePath, caDockerStorePath);
  }

  async function getUserIdentity(registerUser, targetName, caHost, caPort, caStorePath, caDockerStorePath, networkType = 'ca_v1.1') {
    return await app.getUserIdentityV1_4(registerUser, targetName, caHost, caPort, caStorePath, caDockerStorePath);
  }

  async function reenrollUser(registerUser, name, mspId, caHost, caPort, caStorePath, caDockerStorePath, networkType = 'ca_v1.1') {
    return await app.reenrollUserV1_4(registerUser, name, mspId, caHost, caPort, caStorePath, caDockerStorePath);
  }

  async function createUserAffiliation(registerUser, name, caHost, caPort, caStorePath, caDockerStorePath, networkType = 'ca_v1.1') {
    return await app.createUserAffiliationV1_4(registerUser, name, caHost, caPort, caStorePath, caDockerStorePath);
  }

  async function getUserAffiliations(registerUser, caHost, caPort, caStorePath, caDockerStorePath, networkType = 'ca_v1.1') {
    return await app.getUserAffiliationsV1_4(registerUser, caHost, caPort, caStorePath, caDockerStorePath);
  }

  async function delUserAffiliations(registerUser, name, caHost, caPort, caStorePath, caDockerStorePath, networkType = 'ca_v1.1') {
    return await app.delUserAffiliationsV1_4(registerUser, name, caHost, caPort, caStorePath, caDockerStorePath);
  }

  async function updateUserAffiliation(sourceName, targetName, caHost, caPort, caStorePath, caDockerStorePath, networkType = 'ca_v1.1') {
    return await app.updateUserAffiliationV1_4(sourceName, targetName, caHost, caPort, caStorePath, caDockerStorePath);
  }
  
  async function generateCRL(registerUser, request, caHost, caPort, caStorePath, caDockerStorePath, networkType) {
    return await app.generateCRLV1_4(registerUser, request, caHost, caPort, caStorePath, caDockerStorePath);
  }

  app.enrollAdmin = enrollAdmin;
  app.registerUser = registerUser;
  app.deleteUser = deleteUser;
  app.getUserIdentity = getUserIdentity;
  app.reenrollUser = reenrollUser;
  app.createUserAffiliation = createUserAffiliation;
  app.getUserAffiliations = getUserAffiliations;
  app.delUserAffiliations = delUserAffiliations;
  app.updateUserAffiliation = updateUserAffiliation;
  app.generateCRL = generateCRL;
}
