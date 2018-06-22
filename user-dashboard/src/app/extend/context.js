/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = {
  get helper() {
    return this.app.fabricHelper;
  },
  get getClientForOrg() {
    return this.app.getClientForOrg;
  },
  get getOrgAdmin() {
    return this.app.getOrgAdmin;
  },
  get getChannelForOrg() {
    return this.app.getChannelForOrg;
  },
  get createChannel() {
    return this.app.createChannel;
  },
  get joinChannel() {
    return this.app.joinChannel;
  },
  get installSmartContract() {
    return this.app.installSmartContract;
  },
  get instantiateSmartContract() {
    return this.app.instantiateSmartContract;
  },
  get sleep() {
    return this.app.sleep;
  },
};
