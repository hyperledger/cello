/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = {
  get fabricHelper() {
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
  get invokeChainCode() {
    return this.app.invokeChainCode;
  },
  get queryChainCode() {
    return this.app.queryChainCode;
  },
  get instantiateSmartContract() {
    return this.app.instantiateSmartContract;
  },
  get getChainInfo() {
    return this.app.getChainInfo;
  },
  get getChannelHeight() {
    return this.app.getChannelHeight;
  },
  get getBlockByNumber() {
    return this.app.getBlockByNumber;
  },
  get getRecentBlock() {
    return this.app.getRecentBlock;
  },
  get getRecentTransactions() {
    return this.app.getRecentTransactions;
  },
  get getChainCodes() {
    return this.app.getChainCodes;
  },
  get getChannels() {
    return this.app.getChannels;
  },
  get sleep() {
    return this.app.sleep;
  },
  get getRegisteredUserV1_2() {
    return this.app.getRegisteredUserV1_2;
  },
  get parse() {
    return this.app.parse;
  },
  get Parse() {
    return this.app.Parse;
  },
};
