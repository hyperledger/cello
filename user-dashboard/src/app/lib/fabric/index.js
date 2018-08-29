'use strict';

module.exports = app => {
  async function getClientForOrg(org, clients, networkType = 'fabric-1.0', network, username = '') {
    switch (networkType) {
      case 'fabric-1.0':
      default:
        return await app.getClientForOrgV1_0(org, clients);
      case 'fabric-1.2':
        return await app.getClientForOrgV1_2(org, network, username);
    }
  }
  async function getChannelForOrg(org, channels, networkType = 'fabric-1.0') {
    switch (networkType) {
      case 'fabric-1.0':
      default:
        return await app.getChannelForOrgV1_0(org, channels);
    }
  }
  async function getOrgAdmin(userOrg, helper, networkType = 'fabric-1.0') {
    switch (networkType) {
      case 'fabric-1.0':
      default:
        return await app.getOrgAdminV1_0(userOrg, helper);
    }
  }
  async function createChannel(network, keyValueStorePath, channelName, channelConfigPath, orgName = 'org1', networkType = 'fabric-1.0') {
    switch (networkType) {
      case 'fabric-1.0':
      default:
        return await app.createChannelV1_0(network, keyValueStorePath, channelName, channelConfigPath);
      case 'fabric-1.2':
        return await app.createChannelV1_2(network, keyValueStorePath, channelName, channelConfigPath, orgName);
    }
  }
  async function joinChannel(network, keyValueStorePath, channelName, peers, org, networkType = 'fabric-1.0', username = '') {
    switch (networkType) {
      case 'fabric-1.0':
      default:
        return await app.joinChannelV1_0(network, keyValueStorePath, channelName, peers, org);
      case 'fabric-1.2':
        return await app.joinChannelV1_2(network, keyValueStorePath, channelName, peers, org, username);
    }
  }
  async function installSmartContract(network, keyValueStorePath, peers, userId, smartContractCodeId, chainId, org, networkType = 'fabric-1.0', username = '') {
    switch (networkType) {
      case 'fabric-1.0':
      default:
        return await app.installSmartContractV1_0(network, keyValueStorePath, peers, userId, smartContractCodeId, chainId, org);
      case 'fabric-1.2':
        return await app.installSmartContractV1_2(network, keyValueStorePath, peers, userId, smartContractCodeId, chainId, org, username);
    }
  }
  async function instantiateSmartContract(network, keyValueStorePath, channelName, deployId, functionName, args, org, networkType = 'fabric-1.0', peers, username = '') {
    switch (networkType) {
      case 'fabric-1.0':
      default:
        return await app.instantiateSmartContractV1_0(network, keyValueStorePath, channelName, deployId, functionName, args, org);
      case 'fabric-1.2':
        return await app.instantiateSmartContractV1_2(network, keyValueStorePath, channelName, deployId, functionName, args, org, peers, username);
    }
  }
  async function invokeChainCode(network, keyValueStorePath, peerNames, channelName, chainCodeName, fcn, args, username, org, networkType = 'fabric-1.0') {
    switch (networkType) {
      case 'fabric-1.0':
      default:
        return await app.invokeChainCodeV1_0(network, keyValueStorePath, peerNames, channelName, chainCodeName, fcn, args, username, org);
      case 'fabric-1.2':
        return await app.invokeChainCodeV1_2(network, keyValueStorePath, peerNames, channelName, chainCodeName, fcn, args, username, org);
    }
  }
  async function queryChainCode(network, keyValueStorePath, peer, channelName, chainCodeName, fcn, args, username, org, networkType = 'fabric-1.0') {
    switch (networkType) {
      case 'fabric-1.0':
      default:
        return await app.queryChainCodeV1_0(network, keyValueStorePath, peer, channelName, chainCodeName, fcn, args, username, org);
      case 'fabric-1.2':
        return await app.queryChainCodeV1_2(network, keyValueStorePath, peer, channelName, chainCodeName, fcn, args, username, org);
    }
  }
  async function getChainInfo(network, keyValueStorePath, peer, username, org, networkType = 'fabric-1.0', channelName = '') {
    switch (networkType) {
      case 'fabric-1.0':
      default:
        return await app.getChainInfoV1_0(network, keyValueStorePath, peer, username, org);
      case 'fabric-1.2':
        return await app.getChainInfoV1_2(network, keyValueStorePath, peer, username, org, channelName);
    }
  }
  async function getChannelHeight(network, keyValueStorePath, peer, username, org, networkType = 'fabric-1.0', channelName = '') {
    switch (networkType) {
      case 'fabric-1.0':
      default:
        return await app.getChannelHeightV1_0(network, keyValueStorePath, peer, username, org);
      case 'fabric-1.2':
        return await app.getChannelHeightV1_2(network, keyValueStorePath, peer, username, org, channelName);
    }
  }
  async function getBlockByNumber(network, keyValueStorePath, peer, blockNumber, username, org, networkType = 'fabric-1.0') {
    switch (networkType) {
      case 'fabric-1.0':
      default:
        return await app.getBlockByNumberV1_0(network, keyValueStorePath, peer, blockNumber, username, org);
    }
  }
  async function getRecentBlock(network, keyValueStorePath, peer, username, org, count, networkType = 'fabric-1.0', channelName = '') {
    switch (networkType) {
      case 'fabric-1.0':
      default:
        return await app.getRecentBlockV1_0(network, keyValueStorePath, peer, username, org, count);
      case 'fabric-1.2':
        return await app.getRecentBlockV1_2(network, keyValueStorePath, peer, username, org, count, channelName);
    }
  }
  async function getRecentTransactions(network, keyValueStorePath, peer, username, org, count, networkType = 'fabric-1.0', channelName = '') {
    switch (networkType) {
      case 'fabric-1.0':
      default:
        return await app.getRecentTransactionsV1_0(network, keyValueStorePath, peer, username, org, count);
      case 'fabric-1.2':
        return await app.getRecentTransactionsV1_2(network, keyValueStorePath, peer, username, org, count, channelName);
    }
  }
  async function getChannels(network, keyValueStorePath, peer, username, org, networkType = 'fabric-1.0') {
    switch (networkType) {
      case 'fabric-1.0':
      default:
        return await app.getChannelsV1_0(network, keyValueStorePath, peer, username, org);
      case 'fabric-1.2':
        return await app.getChannelsV1_2(network, keyValueStorePath, peer, username, org);
    }
  }
  async function getChainCodes(network, keyValueStorePath, peer, type, username, org, networkType = 'fabric-1.0', channelName = '') {
    switch (networkType) {
      case 'fabric-1.0':
      default:
        return await app.getChainCodesV1_0(network, keyValueStorePath, peer, type, username, org);
      case 'fabric-1.2':
        return await app.getChainCodesV1_2(network, keyValueStorePath, peer, type, username, org, channelName);
    }
  }
  async function fabricHelper(network, keyValueStore, networkType = 'fabric-1.0') {
    switch (networkType) {
      case 'fabric-1.0':
      default:
        return await app.fabricHelperV1_0(network, keyValueStore);
    }
  }
  async function sleep(sleep_time_ms) {
    return new Promise(resolve => setTimeout(resolve, sleep_time_ms));
  }
  app.fabricHelper = fabricHelper;
  app.getClientForOrg = getClientForOrg;
  app.getOrgAdmin = getOrgAdmin;
  app.getChannelForOrg = getChannelForOrg;
  app.createChannel = createChannel;
  app.joinChannel = joinChannel;
  app.installSmartContract = installSmartContract;
  app.instantiateSmartContract = instantiateSmartContract;
  app.invokeChainCode = invokeChainCode;
  app.queryChainCode = queryChainCode;
  app.getChainInfo = getChainInfo;
  app.getChannelHeight = getChannelHeight;
  app.getBlockByNumber = getBlockByNumber;
  app.getRecentBlock = getRecentBlock;
  app.getRecentTransactions = getRecentTransactions;
  app.getChannels = getChannels;
  app.getChainCodes = getChainCodes;
  app.sleep = sleep;
  // hfc.setLogger(app.logger);
};
