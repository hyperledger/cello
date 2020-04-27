'use strict';

module.exports = app => {
    // async function getClientForOrg(org, clients, networkType = 'fabric-1.0', network, username = '') {
    //   switch (networkType) {
    //     case 'fabric-1.0':
    //     default:
    //       return await app.getClientForOrgV1_0(org, clients);
    //     case 'fabric-1.1':
    //       return await app.getClientForOrgV1_1(org, network, username);
    //   }
    // }
    async function getChannelForOrg(org, channels, networkType = 'fabric-1.0') {
        return await app.getChannelForOrgV1_4(org, channels);
    }
    async function getOrgAdmin(userOrg, helper, networkType = 'fabric-1.0') {
        return await app.getOrgAdminV1_4(userOrg, helper);
    }
    async function createChannel(network, channelName, channelConfigPath, orgName = 'org1', userName, networkType = 'fabric-1.1') {
        return await app.createChannelV1_4(network, channelName, channelConfigPath, userName, orgName);
    }
    async function joinChannel(network, channelName, peers, org, networkType = 'fabric-1.1', username) {
        return await app.joinChannelV1_4(network, channelName, peers, org, username);
    }
    
    async function instantiateChainCode(network, orgName, channelData, chainCodeData, body, userName) {
        const networkType = channelData.version;
        return await app.instantiateChainCodeV1_4(network, orgName, channelData, chainCodeData, body, userName);
    }
    
    async function upgradeChainCode(network, orgName, channelData, chainCodeData, body, userName, peers) {
        const networkType = channelData.version;
        return await app.upgradeChainCodeV1_4(network, orgName, channelData, chainCodeData, body, userName, peers);
    }
    
    async function installChainCode(network, orgName, chainCodeData, chainCodePath, body, username,networkType = 'fabric-1.4',) {
        return await app.installChainCodeV1_4(network, orgName, chainCodeData, chainCodePath, body,username);
    }
    
    async function installSmartContract(network, keyValueStorePath, peers, userId, smartContractCodeId, chainId, org, networkType = 'fabric-1.0', username = '') {
        return await app.installSmartContractV1_4(network, keyValueStorePath, peers, userId, smartContractCodeId, chainId, org, username);
    }
    async function instantiateSmartContract(network, keyValueStorePath, channelName, deployId, functionName, args, org, networkType = 'fabric-1.0', peers, username = '') {
        return await app.instantiateSmartContractV1_4(network, keyValueStorePath, channelName, deployId, functionName, args, org, peers, username);
    }
    async function invokeChainCode(network, peerNames, channelName, chainCodeName, fcn, args, username, org, networkType = 'fabric-1.1', recovery) {
        return await app.invokeChainCodeV1_4(network, peerNames, channelName, chainCodeName, fcn, args, username, org, recovery);
    }
    async function queryChainCode(network, peer, channelName, chainCodeName, fcn, args, username, org, networkType = 'fabric-1.1') {
        return await app.queryChainCodeV1_4(network, peer, channelName, chainCodeName, fcn, args, username, org);
    }
    async function getChainInfo(network, keyValueStorePath, peer, username, org, networkType = 'fabric-1.0', channelName = '') {
        return await app.getChainInfoV1_4(network, keyValueStorePath, peer, username, org, channelName);
    }
    async function getChannelHeight(network, keyValueStorePath, peer, username, org, networkType = 'fabric-1.0', channelName = '') {
        return await app.getChannelHeightV1_4(network, keyValueStorePath, peer, username, org, channelName);
    }
    async function getRecentBlock(network, keyValueStorePath, peer, username, org, count, networkType = 'fabric-1.0', channelName = '') {
        return await app.getRecentBlockV1_4(network, keyValueStorePath, peer, username, org, count, channelName);
    }
    async function getRecentTransactions(network, keyValueStorePath, peer, username, org, count, networkType = 'fabric-1.0', channelName = '') {
        return await app.getRecentTransactionsV1_4(network, keyValueStorePath, peer, username, org, count, channelName);
    }
    async function getChannels(network, keyValueStorePath, peer, username, org, networkType = 'fabric-1.0') {
        return await app.getChannelsV1_4(network, keyValueStorePath, peer, username, org);
    }
    async function getChainCodes(network, keyValueStorePath, peer, type, username, org, networkType = 'fabric-1.0', channelName = '') {
        return await app.getChainCodesV1_4(network, keyValueStorePath, peer, type, username, org, channelName);
    }
    async function fabricHelper(network, keyValueStore, networkType = 'fabric-1.0') {
        return await app.fabricHelperV1_4(network, keyValueStore);
    }
    async function sleep(sleep_time_ms) {
        return new Promise(resolve => setTimeout(resolve, sleep_time_ms));
    }
    async function getPeersForChannel(network, keyValueStorePath, channelName, orgName, networkType = 'fabric-1.0') {
        return await app.getPeersForChannelV1_4(network, keyValueStorePath, channelName, orgName);
    }
    
    async function getPeersForOrg(network, orgName){
        return await app.getPeersForOrgV1_1(network,orgName);
    }
    
    async function getChannelNameTest(network, keyValueStorePath, channelName){
        return await app.getChannelNameTestV1_0(network, keyValueStorePath, channelName);
    }
    
    async function signUpdate(network, channelName, org, orgId, username, channeldb, config, newOrgId, newOrgName, signedusers, networkType = 'fabric-1.4'){
        return await app.signUpdateV1_4(network, channelName, org, orgId, username, channeldb, config, newOrgId, newOrgName, signedusers);
    }
    async function removeOrgFromChannel(network, channelName, OrgName, curOrgId, userName, channeldb, config, targetOrgId, targetOrgName, signedusers, networkType) {
        return await app.removeOrgFromChannelV1_4(network, channelName, OrgName, curOrgId, userName, channeldb, config, targetOrgId, targetOrgName, signedusers);
    }
    
    async function getChannelInfo(network, networkId, channelName, service_object, organizations_object, peer_org_dicts, networkType = 'fabric-1.4'){
        return await app.getChannelInfoV1_4(network, networkId, channelName, service_object, organizations_object, peer_org_dicts);
    }
    async function getChannelOrdererInfo(network, networkId, channelName, service_object, organizations_object, orderer_org_dicts, request_host_ports, networkType = 'fabric-1.4'){
        return await app.getChannelOrdererInfoV1_4(network, networkId, channelName, service_object, organizations_object, orderer_org_dicts, request_host_ports);
    }
    
    app.getChannelNameTest = getChannelNameTest;
    app.fabricHelper = fabricHelper;
    // app.getClientForOrg = getClientForOrg;
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
    app.getRecentBlock = getRecentBlock;
    app.getRecentTransactions = getRecentTransactions;
    app.getChannels = getChannels;
    app.getChainCodes = getChainCodes;
    app.sleep = sleep;
    app.getPeersForChannel = getPeersForChannel;
    app.getPeersForOrg = getPeersForOrg;
    app.instantiateChainCode = instantiateChainCode;
    app.upgradeChainCode = upgradeChainCode;
    app.installChainCode = installChainCode;
    app.signUpdate = signUpdate;
    app.removeOrgFromChannel = removeOrgFromChannel;
    app.getChannelInfo = getChannelInfo;
    app.getChannelOrdererInfo = getChannelOrdererInfo;
    
    // hfc.setLogger(app.logger);
};
