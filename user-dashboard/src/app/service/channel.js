
'use strict';

const Service = require('egg').Service;
const fs = require('fs-extra');
const shell = require('shelljs');
const yaml = require('node-yaml');

const fabricVer = { 'fabric-1.1': 'v1_1',
    'fabric-1.4': 'v1_4' };

class ChannelService extends Service {
    async getChannels() {
        const { ctx } = this;
        const userName = ctx.user.username;
        const orgName = userName.split('@')[1];
        const channelRes = [];
        const saveChannel = [];
        const channels = await ctx.model.Channel.find();
        if (channels.length === 0) {
            return {
                channels: channelRes,
                success: true
            };
        }
        
        try {
            const endportsUrl = 'http://operator-dashboard:8071/v2/blockchain_networks';
            const res = await ctx.curl(endportsUrl, {
                method: 'GET',
            });
            
            if (res.status !== 200) {
                return {
                    channels: channelRes,
                    success: false,
                    msg:"get network list fail"
                };
            }
            const networks = JSON.parse(res.data.toString());
            const networkArray = networks.blockchain_networks;
            
            if (networkArray.length === 0) {
                // await ctx.model.Channel.remove({});
                return {
                    channels: channelRes,
                    success: true
                };
            }
            
            for (const channel in channels) {
                let netExist = false;
                
                for (const network in networkArray) {
                    if (channels[channel].blockchain_network_id === networkArray[network].id) {
                        netExist = true;
                        break;
                    }
                }
                if (netExist) {
                    saveChannel.push(channels[channel]);
                }
            }
        } catch (e) {
            return {
                success: false,
                msg: e.toString()
            }
        }
        
        for (const channel in saveChannel) {
            let bAdd = false;
            const orgsId = [];
            for (let org = 0; org < saveChannel[channel].peer_orgsName.length; org++) {
                orgsId.push(saveChannel[channel].peer_orgsName[org].id);
                
                if (saveChannel[channel].peer_orgsName[org].name === orgName) {
                    bAdd = true;
                }
            }
            
            if (bAdd) {
                channelRes.push({
                    id: saveChannel[channel]._id,
                    name: saveChannel[channel].name,
                    description: saveChannel[channel].description,
                    orderer_url: saveChannel[channel].orderer_url,
                    creator_id: saveChannel[channel].creator_id,
                    creator_name: saveChannel[channel].creator_name,
                    blockchain_network_id: saveChannel[channel].blockchain_network_id,
                    peer_orgs: orgsId,
                    create_ts: saveChannel[channel].date,
                });
            }
        }
        return {
            channels: channelRes,
            success: true
        };
    }
    
    async getChannel() {
        const { ctx } = this;
        const channel_id = ctx.params.channel_id;
        const channel = await ctx.model.Channel.findOne({ _id: channel_id });
        const userName = ctx.user.username;
        const orgName = userName.split('@')[1];
        
        try {
            for (let org = 0; org < channel.peer_orgsName.length; org++) {
                if (channel.peer_orgsName[org].name === orgName) {
                    const orgids = [];
                    for (let org = 0; org < channel.peer_orgsName.length; org++) {
                        orgids.push(channel.peer_orgsName[org].id);
                    }
                    return {
                        channel: {
                            id: channel._id,
                            name: channel.name,
                            description: channel.description,
                            orderer_url: channel.orderer_url,
                            creator_id: channel.creator_id,
                            creator_name: channel.creator_name,
                            blockchain_network_id: channel.blockchain_network_id,
                            peer_orgs: orgids,
                            create_ts: channel.date,
                        },
                        success: true
                    };
                }
            }
        }
        catch (e) {
            return {
                success: false,
                msg: e.toString()
            }
        }
        return { channel: {},success: true };
    }
    
    async getPeers() {
        const { ctx } = this;
        const params = ctx.request.query;
        
        if (params.channel_id) {
            return await this.getPeersForChannel(params.channel_id);
        } else {
            return await this.getPeersForOrg();
        }
    }
    
    async getPeersForOrg() {
        const { ctx } = this;
        const userName = ctx.user.username;
        const orgNameForUser = userName.split('@')[1].split('.')[0];
        let orgResponse;
        
        try {
            const orgUrl = `http://operator-dashboard:8071/v2/organizations?name=${orgNameForUser}`;
            orgResponse = await ctx.curl(orgUrl, {
                method: 'GET',
            });
        } catch (e) {
            return {
                peers: [],
                message: 'get org infor fail',
            };
        }
        
        let data;
        if (orgResponse.status === 200) {
            data = JSON.parse(orgResponse.data.toString());
        } else {
            const e = new Error('get organization fail.');
            return e;
        }
        
        const networkId = data.organizations[0].blockchain_network_id;
        const endportsUrl = `http://operator-dashboard:8071/v2/blockchain_networks/${networkId}/serviceendpoints`;
        const response = await ctx.curl(endportsUrl, {
            method: 'GET',
        });
        if (response.status === 200) {
            const endportsInfor = JSON.parse(response.data.toString());
            const peerInfors = endportsInfor.service_endpoints;
            const peerNames = [];
            for (const infor in peerInfors) {
                if (peerInfors[infor].service_type === 'peer') {
                    const name = peerInfors[infor].service_name.split('.').slice(0)[1];
                    if (name === orgNameForUser && peerInfors[infor].peer_port_proto === 'grpc') {
                        peerNames.push({
                            name:peerInfors[infor].service_name,
                            ip: peerInfors[infor].service_ip + ':' + peerInfors[infor].service_port
                        });
                    }
                }
            }
            const allPeers = [];
            for (const peer in peerNames) {
                allPeers.push({
                    name: peerNames[peer].name,
                    ip: peerNames[peer].ip,
                    channel_id: '',
                    roles: '',
                    organization_id: data.organizations[0].id,
                });
            }
            return { peers: allPeers };
        }
        return {
            peers: [],
            message: 'get org infor fail',
        };
    }
    
    async getPeersForChannel(channel_id) {
        const { ctx } = this;
        const channel = await ctx.model.Channel.findOne({ _id: channel_id });
        const userName = ctx.user.username;
        const orgName = userName.split('@')[1].split('.')[0];
        let success = true;
        let message = '';
        
        if (channel === null) {
            return {
                peers: [],
                success: false
            }
        }
        
        const networkId = channel.blockchain_network_id;
        const endportsUrl = `http://operator-dashboard:8071/v2/blockchain_networks/${networkId}/serviceendpoints`;
        const healthyUrl = `http://operator-dashboard:8071/v2/blockchain_networks/${orgName}/organizationhealthy`;
        const response = await ctx.curl(endportsUrl, {
            method: 'GET',
        });
        const healthyResponse = await ctx.curl(healthyUrl, {
            method: 'GET'
        });
        if (response.status !== 200) {
            message = 'get serviceendpoints fail';
            success = false;
        }
        if (healthyResponse.status !== 200) {
            message = 'get organizationhealthy fail';
            success = false;
        }
        
        const endportsInfor = JSON.parse(response.data.toString());
        const healthyData = JSON.parse(healthyResponse.data.toString()).healthy || [];
        
        const peerInfors = endportsInfor.service_endpoints;
        const allPeers = [];
        const peers = channel.peers_inChannel;
        
        for (let peer = 0; peer < peers.length; peer++) {
            const org = peers[peer].name.split('.')[1];
            if (org === orgName) {
                let ip = '';
                let healthyState = true;
                for (const infor in peerInfors) {
                    if (peerInfors[infor].service_type === 'peer') {
                        const name = peerInfors[infor].service_name;
                        if (name === peers[peer].name && peerInfors[infor].peer_port_proto === 'grpc') {
                            ip = peerInfors[infor].service_ip + ':' + peerInfors[infor].service_port;
                        }
                    }
                }
                for (let item in healthyData) {
                    if (healthyData[item].service_name === peers[peer].name) {
                        healthyState = healthyData[item].healthy;
                    }
                }
                
                allPeers.push({
                    name: peers[peer].name,
                    channel_id,
                    roles: peers[peer].roles,
                    ip: ip,
                    healthyState: healthyState
                });
            }
        }
        return { peers: allPeers };
    }
    
    async changePeerRole() {
        const { ctx } = this;
        const peerInfo = ctx.request.body.peer;
        const channelId = ctx.request.body.channel_id;
        const userName = ctx.user.username;
        const orgName = userName.split('@')[1].split('.')[0];
        
        if (orgName !== peerInfo.name.split('.')[1]) {
            return {
                success: false,
                message: 'The peer doesn\'t belong to you.'
            }
        }
        
        if (userName.split('@')[0] !== 'Admin') {
            return {
                success: false,
                message: 'Authorization failure,please contact the administrator.'
            }
        }
        
        const channelInfo = await ctx.model.Channel.findOne({ _id: channelId });
        let targetPeer = '';
        let i = 0;
        
        for (; i < channelInfo.peers_inChannel.length; i++) {
            if (channelInfo.peers_inChannel[i].name === peerInfo.name) {
                targetPeer = channelInfo.peers_inChannel[i];
                break;
            }
        }
        
        if (targetPeer === '') {
            return {
                success: false,
                message: 'Can\'t find the peer in channel ' + channelId
            }
        }
        
        targetPeer.roles.chaincodeQuery = peerInfo.roles.chaincodeQuery;
        targetPeer.roles.endorsingPeer = peerInfo.roles.endorsingPeer;
        targetPeer.roles.ledgerQuery = peerInfo.roles.ledgerQuery;
        
        channelInfo.peers_inChannel[i] = targetPeer;
        
        await ctx.model.Channel.findOneAndUpdate(
            { _id: channelId }, { peers_inChannel: channelInfo.peers_inChannel },
            { upsert: true });
        
        return {
            success: true,
            peer: targetPeer
        }
    }
    
    async serviceEndpointsDataCreate(channelId) {
        const { ctx } = this;
        const channelInfo = await ctx.model.Channel.findOne({ _id: channelId });
        
        const networkId = channelInfo.blockchain_network_id;
        
        const networkUrl = `http://operator-dashboard:8071/v2/blockchain_networks/${networkId}/serviceendpoints`;
        const networkResponse = await ctx.curl(networkUrl, {
            method: 'GET',
        });
        if (networkResponse.status === 200) {
            const data = JSON.parse(networkResponse.data.toString());
            const dataEnpoints = data.service_endpoints;
            const peerName = [];
            const orgName = [];
            let orgConfigName;
            let orgConfigMspId;
            let peer_grpc;
            let peer_event;
            
            for (const keys in dataEnpoints) {
                const channelInfoIfExist = await ctx.model.ServiceEndpoint.findOne({
                    networkid: networkId,
                    channel: channelId,
                    service_name: dataEnpoints[keys].service_name,
                });
                
                if (channelInfoIfExist != null) {
                    console.log(channelInfoIfExist.grpc);
                    console.log(channelInfoIfExist.event);
                }
                
                if (channelInfoIfExist === null) {
                    if (dataEnpoints[keys].service_type === 'peer') {
                        const keysOrgName = dataEnpoints[keys].service_name.split('.').slice(0)[1];
                        console.log(keysOrgName);
                        if (orgName.includes(keysOrgName) === false) {
                            orgName.push(keysOrgName);
                        }
                        const orgmspname = dataEnpoints[keys].service_name.split('.').slice(0)[1];
                        const orgMspName = orgmspname.substring(0, 1).toUpperCase() + orgmspname.substring(1);
                        orgConfigName = 'peer' + orgMspName;
                        orgConfigMspId = `${orgMspName}MSP`;
                        
                        if (dataEnpoints[keys].peer_port_proto === 'grpc') {
                            peer_grpc = `${dataEnpoints[keys].service_ip}:${dataEnpoints[keys].service_port}`;
                        } else if (dataEnpoints[keys].peer_port_proto === 'event') {
                            peer_event = `${dataEnpoints[keys].service_ip}:${dataEnpoints[keys].service_port}`;
                        }
                        
                        if (peerName.includes(dataEnpoints[keys].service_name) === false) {
                            peerName.push(dataEnpoints[keys].service_name);
                            await ctx.model.ServiceEndpoint.create({
                                networkid: networkId,
                                channel: channelId,
                                org_config_name: orgConfigName,
                                org_config_mspid: orgConfigMspId,
                                service_name: dataEnpoints[keys].service_name,
                                service_type: dataEnpoints[keys].service_type,
                                service_ip: dataEnpoints[keys].service_ip,
                                grpc: peer_grpc,
                                event: peer_event,
                                
                            });
                        }
                    } else {
                        await ctx.model.ServiceEndpoint.create({
                            networkid: networkId,
                            channel: channelId,
                            service_name: dataEnpoints[keys].service_name,
                            service_type: dataEnpoints[keys].service_type,
                            service_ip: dataEnpoints[keys].service_ip,
                            service_port: dataEnpoints[keys].service_port,
                        });
                    }
                    
                } else if (((channelInfoIfExist.grpc === undefined) && (dataEnpoints[keys].peer_port_proto === 'grpc')) ||
                    ((channelInfoIfExist.event === undefined) && (dataEnpoints[keys].peer_port_proto === 'event'))) {
                    
                    if ((dataEnpoints[keys].peer_port_proto) === 'grpc') {
                        await ctx.model.ServiceEndpoint.update({
                            _id: channelInfoIfExist._id.toString(),
                        }, {'$set': { grpc: `${dataEnpoints[keys].service_ip}:${dataEnpoints[keys].service_port}` } }, { upsert: true });
                    } else {
                        await ctx.model.ServiceEndpoint.update({
                            _id: channelInfoIfExist._id.toString(),
                        }, {'$set': { event: `${dataEnpoints[keys].service_ip}:${dataEnpoints[keys].service_port}` } }, { upsert: true });
                    }
                }
            }
        }
    }
    
    
    async generateNetworkAddPeers(channelId, peersServiceName) {
        const { ctx } = this;
        
        //  await this.serviceEndpointsDataCreate(networkId);
        
        
        const serviceEndpoints = await ctx.model.ServiceEndpoint.find({ channel: channelId });
        const networkId = serviceEndpoints[0].networkid;
        
        let orgConfigSequence = 0;
        const orgMspNames = [];
        const orgNames = [];
        const orgNumber = [];
        const caAddress = {};
        const network = {};
        const peerOrgs = {};
        
        for (const keys in serviceEndpoints) {
            if (serviceEndpoints[keys].service_type === 'ca') {
                caAddress[serviceEndpoints[keys].service_name.split('.').slice(1).join('.')] = `${serviceEndpoints[keys].service_ip}:${serviceEndpoints[keys].service_port}`;
            }
        }
        for (const keys in serviceEndpoints) {
            if (serviceEndpoints[keys].service_type === 'orderer') {
                const orderUrl = `${serviceEndpoints[keys].service_ip}:${serviceEndpoints[keys].service_port}`;
                const ordererDomain = serviceEndpoints[keys].service_name.split('.').slice(1).join('.');
                network.orderer = {
                    url: `grpcs://${orderUrl}`,
                    'server-hostname': serviceEndpoints[keys].service_name,
                    tls_cacerts: `/opt/fabric/${networkId}/crypto-config/ordererOrganizations/${ordererDomain}/orderers/${serviceEndpoints[keys].service_name}/tls/ca.crt`,
                };
            } else if (serviceEndpoints[keys].service_type === 'peer') {
                
                if (orgMspNames.includes(serviceEndpoints[keys].org_config_name) === false) {
                    orgConfigSequence += 1;
                    orgMspNames.push(serviceEndpoints[keys].org_config_name);
                }
                // let orgConfigSequence = serviceEndpoints[keys].org_config_name.charAt(serviceEndpoints[keys].org_config_name.length-1);
                if (orgNumber.includes(orgConfigSequence) === false) {
                    peerOrgs[orgConfigSequence] = {};
                    orgNumber.push(orgConfigSequence);
                }
                
                const orgNameDomain = serviceEndpoints[keys].service_name.split('.').slice(1).join('.');
                
                if (peersServiceName.includes(serviceEndpoints[keys].service_name) === true) {
                    peerOrgs[orgConfigSequence][`peer${parseInt(serviceEndpoints[keys].service_name.charAt(4))}`] = {
                        requests: `grpcs://${serviceEndpoints[keys].grpc}`,
                        events: `grpcs://${serviceEndpoints[keys].event}`,
                        'server-hostname': serviceEndpoints[keys].service_name,
                        tls_cacerts: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/peers/${serviceEndpoints[keys].service_name}/tls/ca.crt`,
                    };
                }
                
                if (orgNames.includes(serviceEndpoints[keys].org_config_name) === false) {
                    network[`org${orgConfigSequence}`] = {
                        name: serviceEndpoints[keys].org_config_name,
                        mspid: serviceEndpoints[keys].org_config_mspid,
                        ca: `https://${caAddress[serviceEndpoints[keys].service_name.split('.').slice(1).join('.')]}`,
                        peers: peerOrgs[orgConfigSequence],
                        admin: {
                            key: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/users/Admin@${orgNameDomain}/msp/keystore`,
                            cert: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/users/Admin@${orgNameDomain}/msp/signcerts`,
                        },
                    };
                }
                orgNames.push(serviceEndpoints[keys].org_config_name);
            }
            
        }
        
        //  await ctx.model.ServiceEndpoint.remove();
        
        return network;
    }
    
    
    async generateNetworkAddPeersV1_1(channelId, network, peersServiceName) {
        const { ctx } = this;
        
        const channel = await ctx.model.Channel.findOne({ _id: channelId });
        const peer_orgs = channel.peer_orgsName;
        const serviceEndpoints = await ctx.model.ServiceEndpoint.find({ channel: channelId });
        const networkId = serviceEndpoints[0].networkid;
        
        const peer_orgsName = [];
        const peers = {};
        const peerNames = [];
        const channelsPeers = {};
        for (let i = 0; i < peer_orgs.length; i++) {
            peer_orgsName.push(peer_orgs[i].name);
        }
        
        for (const keys in serviceEndpoints) {
            
            if ((serviceEndpoints[keys].service_type === 'peer') && (peer_orgsName.includes(serviceEndpoints[keys].service_name.split('.').slice(1).join('.')) === true)) {
                let exist = false;
                let index = 0;
                for (;index < peersServiceName.length;index++) {
                    if (peersServiceName[index].name === serviceEndpoints[keys].service_name) {
                        exist = true;
                        break;
                    }
                }
                if (exist) {
                    const orgName = serviceEndpoints[keys].service_name.split('.').slice(1)[0];
                    const orgNameDomain = serviceEndpoints[keys].service_name.split('.').slice(1).join('.');
                    peerNames.push(serviceEndpoints[keys].service_name);
                    
                    peers[serviceEndpoints[keys].service_name] = {
                        eventUrl: `grpcs://${serviceEndpoints[keys].event}`,
                        grpcOptions: {
                            'ssl-target-name-override': serviceEndpoints[keys].service_name,
                        },
                        tlsCACerts: {
                            path: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/peers/${serviceEndpoints[keys].service_name}/tls/ca.crt`,
                        },
                        url: `grpcs://${serviceEndpoints[keys].grpc}`,
                    };
                    
                    
                    network.config.organizations[`${orgName}`].peers = peerNames;
                    
                    // let peerId = parseInt(serviceEndpoints[keys].service_name.split('.').slice(0)[0].charAt(serviceEndpoints[keys].service_name.split('.').slice(0)[0].length - 1));
                    channelsPeers[serviceEndpoints[keys].service_name] = {
                        chaincodeQuery: peersServiceName[index].roles.chaincodeQuery,
                        endorsingPeer: peersServiceName[index].roles.endorsingPeer,
                        eventSource: true,
                        ledgerQuery: peersServiceName[index].roles.ledgerQuery
                    };
                }
            }
        }
        
        network.config.channels[`${channel.name}`].peers = channelsPeers;
        
        network.config.peers = peers;
        
        console.log(network);
        return network;
    }
    
    async generateNetworkFabricV1_0(channelId) {
        const { ctx } = this;
        //
        await this.serviceEndpointsDataCreate(channelId);
        
        const channel = await ctx.model.Channel.findOne({ _id: channelId });
        const peer_orgs = channel.peer_orgsName;
        
        const serviceEndpoints = await ctx.model.ServiceEndpoint.find({ channel: channelId });
        const networkId = serviceEndpoints[0].networkid;
        
        const orgMspNames = [];
        const orgNames = [];
        const caAddress = {};
        const network = {};
        const peerOrgs = {};
        let orgConfigSequence = 0;
        
        const peer_orgsName = [];
        for (let i = 0; i < peer_orgs.length; i++) {
            peer_orgsName.push(peer_orgs[i].name);
        }
        
        for (const keys in serviceEndpoints) {
            if (serviceEndpoints[keys].service_type === 'ca') {
                caAddress[serviceEndpoints[keys].service_name.split('.').slice(1).join('.')] = `${serviceEndpoints[keys].service_ip}:${serviceEndpoints[keys].service_port}`;
            }
        }
        
        for (const keys in serviceEndpoints) {
            console.log(serviceEndpoints[keys].service_name.split('.').slice(1).join('.'));
            if (serviceEndpoints[keys].service_type === 'orderer') {
                const orderUrl = `${serviceEndpoints[keys].service_ip}:${serviceEndpoints[keys].service_port}`;
                const ordererDomain = serviceEndpoints[keys].service_name.split('.').slice(1).join('.');
                network.orderer = {
                    url: `grpcs://${orderUrl}`,
                    'server-hostname': serviceEndpoints[keys].service_name,
                    tls_cacerts: `/opt/fabric/${networkId}/crypto-config/ordererOrganizations/${ordererDomain}/orderers/${serviceEndpoints[keys].service_name}/tls/ca.crt`,
                };
            } else if ((serviceEndpoints[keys].service_type === 'peer') && (peer_orgsName.includes(serviceEndpoints[keys].service_name.split('.').slice(1).join('.')) === true)) {
                
                if (orgMspNames.includes(serviceEndpoints[keys].org_config_name) === false) {
                    orgConfigSequence += 1;
                    peerOrgs[orgConfigSequence] = {};
                    orgMspNames.push(serviceEndpoints[keys].org_config_name);
                }
                
                const orgNameDomain = serviceEndpoints[keys].service_name.split('.').slice(1).join('.');
                
                peerOrgs[orgConfigSequence][`peer${parseInt(serviceEndpoints[keys].service_name.charAt(4)) + 1}`] = {
                    requests: `grpcs://${serviceEndpoints[keys].grpc}`,
                    events: `grpcs://${serviceEndpoints[keys].event}`,
                    'server-hostname': serviceEndpoints[keys].service_name,
                    tls_cacerts: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/peers/${serviceEndpoints[keys].service_name}/tls/ca.crt`,
                };
                
                if (orgNames.includes(serviceEndpoints[keys].org_config_name) === false) {
                    network[`org${orgConfigSequence}`] = {
                        name: serviceEndpoints[keys].org_config_name,
                        mspid: serviceEndpoints[keys].org_config_mspid,
                        ca: `https://${caAddress[serviceEndpoints[keys].service_name.split('.').slice(1).join('.')]}`,
                        // peers:peerOrgs[orgConfigSequence],
                        admin: {
                            key: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/users/Admin@${orgNameDomain}/msp/keystore`,
                            cert: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/users/Admin@${orgNameDomain}/msp/signcerts`,
                        },
                    };
                }
                orgNames.push(serviceEndpoints[keys].org_config_name);
            }
            
        }
        
        // await ctx.model.ServiceEndpoint.remove();
        console.log(network);
        return network;
    }
    
    
    async generateNetworkFabricV1_1(channelId) {
        const { ctx, config } = this;
        
        await this.serviceEndpointsDataCreate(channelId);
        
        const channel = await ctx.model.Channel.findOne({ _id: channelId });
        const peer_orgs = channel.peer_orgsName;
        const orgDomain = channel.creator_name.split('@')[1];
        const serviceEndpoints = await ctx.model.ServiceEndpoint.find({ channel: channelId });
        const networkId = serviceEndpoints[0].networkid;
        const channels = {
            orderers: [],
        };
        const orderers = {};
        let orgConfigSequence = 0;
        const peerOrgs = {};
        const orgMspNames = [];
        const caAddress = {};
        // const keyValueStorePath = `/opt/fabric/${networkId}/client-kvs`;
        let keyValueStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDomain}/ca/Admin@${orgDomain}`;
        const channelsPeers = {};
        let network = {};
        const peerNames = [];
        const organizations = {};
        const certificateAuthorities = {};
        
        const peer_orgsName = [];
        for (let i = 0; i < peer_orgs.length; i++) {
            peer_orgsName.push(peer_orgs[i].name);
        }
        
        for (const keys in serviceEndpoints) {
            if (serviceEndpoints[keys].service_type === 'ca') {
                caAddress[serviceEndpoints[keys].service_name.split('.').slice(1).join('.')] = `${serviceEndpoints[keys].service_ip}:${serviceEndpoints[keys].service_port}`;
            }
        }
        
        for (const keys in serviceEndpoints) {
            if (serviceEndpoints[keys].service_type === 'orderer') {
                const orderUrl = `${serviceEndpoints[keys].service_ip}:${serviceEndpoints[keys].service_port}`;
                const ordererDomain = serviceEndpoints[keys].service_name.split('.').slice(1).join('.');
                orderers[serviceEndpoints[keys].service_name] = {
                    grpcOptions: { 'ssl-target-name-override': serviceEndpoints[keys].service_name },
                    tlsCACerts: { path: `/opt/fabric/${networkId}/crypto-config/ordererOrganizations/${ordererDomain}/orderers/${serviceEndpoints[keys].service_name}/tls/ca.crt` },
                    url: `grpcs://${orderUrl}`,
                };
                
                channels.orderers.push(serviceEndpoints[keys].service_name);
            } else if ((serviceEndpoints[keys].service_type === 'peer') && (peer_orgsName.includes(serviceEndpoints[keys].service_name.split('.').slice(1).join('.')) === true)) {
                peerNames.push(serviceEndpoints[keys].service_name);
                
                if (orgMspNames.includes(serviceEndpoints[keys].org_config_name) === false) {
                    orgConfigSequence += 1;
                    peerOrgs[orgConfigSequence] = {};
                    orgMspNames.push(serviceEndpoints[keys].org_config_name);
                }
                
                const orgNameDomain = serviceEndpoints[keys].service_name.split('.').slice(1).join('.');
                const orgName = serviceEndpoints[keys].service_name.split('.').slice(1)[0];
                /*
                        peers[serviceEndpoints[keys].service_name] = {
                          eventUrl: `grpcs://${serviceEndpoints[keys].event}`,
                          grpcOptions: {
                            'ssl-target-name-override': serviceEndpoints[keys].service_name,
                          },
                          tlsCACerts: {
                            path: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/peers/${serviceEndpoints[keys].service_name}/tls/ca.crt`,
                          },
                          url: `grpcs://${serviceEndpoints[keys].grpc}`,
                        };
                */
                const peerId = parseInt(serviceEndpoints[keys].service_name.split('.').slice(0)[0].charAt(serviceEndpoints[keys].service_name.split('.').slice(0)[0].length - 1));
                channelsPeers[serviceEndpoints[keys].service_name] = {
                    chaincodeQuery: true,
                    endorsingPeer: peerId === 0,
                    eventSource: peerId === 0,
                    ledgerQuery: true,
                };
                
                const admin_sk = fs.readdirSync(`/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/users/Admin@${orgNameDomain}/msp/keystore`);
                organizations[`${orgName}`] = {
                    adminPrivateKey: {
                        path: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/users/Admin@${orgNameDomain}/msp/keystore/${admin_sk[0]}`,
                    },
                    certificateAuthorities: [`ca-${orgName}`],
                    mspid: serviceEndpoints[keys].org_config_mspid,
                    // peers: peerNames,
                    signedCert: {
                        path: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/users/Admin@${orgNameDomain}/msp/signcerts/Admin@${orgNameDomain}-cert.pem`,
                    },
                };
                
                certificateAuthorities[`ca-${orgName}`] = {
                    caName: `ca-${orgName}`,
                    httpOptions: {
                        verify: false,
                    },
                    registrar: [
                        {
                            enrollId: 'admin',
                            enrollSecret: 'adminpw',
                        },
                    ],
                    tlsCACerts: {
                        path: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/ca/ca.${orgNameDomain}-cert.pem`,
                    },
                    url: `https://${caAddress[orgNameDomain]}`,
                };
                keyValueStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/ca/Admin@${orgNameDomain}`;
                network[`${orgName}`] = {
                    'x-type': 'hlfv1',
                    name: `${channel.name}-${orgName}`,
                    description: `org${orgConfigSequence}`,
                    version: '1.0',
                    client: {
                        organization: `${orgName}`,
                        credentialStore: {
                            path: keyValueStorePath,
                            cryptoStore: {
                                path: keyValueStorePath,
                                // path: `${keyValueStorePath}/tmp`,
                            },
                            wallet: 'wallet',
                        },
                    },
                };
            }
        }
        
        // channels.peers = channelsPeers;
        const channelsConfig = {};
        channelsConfig[`${channel.name}`] = channels;
        
        network = Object.assign(network, {
            config: {
                version: '1.0',
                'x-type': 'hlfv1',
                name: `${channel.name}`,
                description: `${channel.name}`,
                orderers,
                certificateAuthorities,
                organizations,
                // peers,
                channels: channelsConfig,
            },
        });
        console.log(network);
        return network;
    }
    
    async generateNetworkFabricV1_4(channelId, userName) {
        const { ctx, config } = this;
        await this.serviceEndpointsDataCreate(channelId);
        
        const channel = await ctx.model.Channel.findOne({ _id: channelId });
        const peer_orgs = channel.peer_orgsName;
        const orgDomain = channel.creator_name.split('@')[1];
        const serviceEndpoints = await ctx.model.ServiceEndpoint.find({ channel: channelId });
        const networkId = serviceEndpoints[0].networkid;
        const channels = {
            orderers: [],
        };
        const orderers = {};
        let orgConfigSequence = 0;
        const peerOrgs = {};
        const orgMspNames = [];
        const caAddress = {};
        // const keyValueStorePath = `/opt/fabric/${networkId}/client-kvs`;
        let keyValueStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDomain}/ca/${userName}`;
        const channelsPeers = {};
        let network = {};
        const peerNames = [];
        const organizations = {};
        const peers = {};
        const certificateAuthorities = {};
        
        const peer_orgsName = [];
        for (let i = 0; i < peer_orgs.length; i++) {
            peer_orgsName.push(peer_orgs[i].name);
        }
        
        for (const keys in serviceEndpoints) {
            if (serviceEndpoints[keys].service_type === 'ca') {
                caAddress[serviceEndpoints[keys].service_name.split('.').slice(1).join('.')] = `${serviceEndpoints[keys].service_ip}:${serviceEndpoints[keys].service_port}`;
            }
        }
        
        for (const keys in serviceEndpoints) {
            if (serviceEndpoints[keys].service_type === 'orderer') {
                const orderUrl = `${serviceEndpoints[keys].service_ip}:${serviceEndpoints[keys].service_port}`;
                const ordererDomain = serviceEndpoints[keys].service_name.split('.').slice(1).join('.');
                orderers[serviceEndpoints[keys].service_name] = {
                    grpcOptions: { 'ssl-target-name-override': serviceEndpoints[keys].service_name },
                    tlsCACerts: { path: `/opt/fabric/${networkId}/crypto-config/ordererOrganizations/${ordererDomain}/orderers/${serviceEndpoints[keys].service_name}/tls/ca.crt` },
                    url: `grpcs://${orderUrl}`,
                };
                
                channels.orderers.push(serviceEndpoints[keys].service_name);
            } else if ((serviceEndpoints[keys].service_type === 'peer') && (peer_orgsName.includes(serviceEndpoints[keys].service_name.split('.').slice(1).join('.')) === true)) {
                peerNames.push(serviceEndpoints[keys].service_name);
                
                if (orgMspNames.includes(serviceEndpoints[keys].org_config_name) === false) {
                    orgConfigSequence += 1;
                    peerOrgs[orgConfigSequence] = {};
                    orgMspNames.push(serviceEndpoints[keys].org_config_name);
                }
                
                const orgNameDomain = serviceEndpoints[keys].service_name.split('.').slice(1).join('.');
                const orgName = serviceEndpoints[keys].service_name.split('.').slice(1)[0];
                
                peers[serviceEndpoints[keys].service_name] = {
                    eventUrl: `grpcs://${serviceEndpoints[keys].event}`,
                    grpcOptions: {
                        'ssl-target-name-override': serviceEndpoints[keys].service_name,
                    },
                    tlsCACerts: {
                        path: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/peers/${serviceEndpoints[keys].service_name}/tls/ca.crt`,
                    },
                    url: `grpcs://${serviceEndpoints[keys].grpc}`,
                };
                
                const peerId = parseInt(serviceEndpoints[keys].service_name.split('.').slice(0)[0].charAt(serviceEndpoints[keys].service_name.split('.').slice(0)[0].length - 1));
                channelsPeers[serviceEndpoints[keys].service_name] = {
                    chaincodeQuery: true,
                    endorsingPeer: peerId === 0,
                    eventSource: peerId === 0,
                    ledgerQuery: true,
                };
                const admin_sk = fs.readdirSync(`/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/users/Admin@${orgNameDomain}/msp/keystore`);
                organizations[`${orgName}`] = {
                    adminPrivateKey: {
                        path: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/users/Admin@${orgNameDomain}/msp/keystore/${admin_sk[0]}`,
                    },
                    certificateAuthorities: [`ca-${orgName}`],
                    mspid: serviceEndpoints[keys].org_config_mspid,
                    peers: peerNames,
                    signedCert: {
                        path: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/users/Admin@${orgNameDomain}/msp/signcerts/Admin@${orgNameDomain}-cert.pem`,
                    },
                };
                
                certificateAuthorities[`ca-${orgName}`] = {
                    caName: `ca-${orgName}`,
                    httpOptions: {
                        verify: false,
                    },
                    registrar: [
                        {
                            enrollId: 'admin',
                            enrollSecret: 'adminpw',
                        },
                    ],
                    tlsCACerts: {
                        path: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/ca/ca.${orgNameDomain}-cert.pem`,
                    },
                    url: `https://${caAddress[orgNameDomain]}`,
                };
            }
        }
        const orgName = userName.split('@')[1].split('.')[0];
        const orgAndDomain = userName.split('@')[1];
        keyValueStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgAndDomain}/ca/${userName}`;
        network[`${orgName}`] = {
            'x-type': 'hlfv1',
            name: `${channel.name}-${orgName}`,
            description: `org${orgConfigSequence}`,
            version: '1.0',
            client: {
                organization: `${orgName}`,
                credentialStore: {
                    path: keyValueStorePath,
                    cryptoStore: {
                        //path: keyValueStorePath,
                        path: keyValueStorePath,
                    },
                    wallet: 'wallet',
                },
            },
        };
        
        // channels.peers = channelsPeers;
        const channelsConfig = {};
        channelsConfig[`${channel.name}`] = channels;
        network = Object.assign(network, {
            config: {
                version: '1.0',
                'x-type': 'hlfv1',
                name: `${channel.name}`,
                description: `${channel.name}`,
                orderers,
                certificateAuthorities,
                organizations,
                // peers,
                channels: channelsConfig,
            },
        });
        
        console.log(network);
        return network;
    }
    
    async generateNetworkForSignup(channelId, signedusers) {
        const { ctx, config } = this;
        
        await this.serviceEndpointsDataCreate(channelId);
        const userName = ctx.req.user.username;
        const curOrg = userName.split('@')[1].split('.')[0];
        const channel = await ctx.model.Channel.findOne({ _id: channelId });
        const peer_orgs = channel.peer_orgsName;
        const orgDomain = channel.creator_name.split('@')[1];
        const serviceEndpoints = await ctx.model.ServiceEndpoint.find({ channel: channelId });
        const networkId = serviceEndpoints[0].networkid;
        const channels = {
            orderers: [],
        };
        const orderers = {};
        let orgConfigSequence = 0;
        const peerOrgs = {};
        const orgMspNames = [];
        const caAddress = {};
        let keyValueStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDomain}/ca/Admin@${orgDomain}`;
        let network = {};
        const organizations = {};
        const certificateAuthorities = {};
        
        const peer_orgsName = [];
        for (let i = 0; i < peer_orgs.length; i++) {
            peer_orgsName.push(peer_orgs[i].name);
        }
        
        for (const keys in serviceEndpoints) {
            if (serviceEndpoints[keys].service_type === 'ca') {
                caAddress[serviceEndpoints[keys].service_name.split('.').slice(1).join('.')] = `${serviceEndpoints[keys].service_ip}:${serviceEndpoints[keys].service_port}`;
            }
        }
        
        for (const keys in serviceEndpoints) {
            if (serviceEndpoints[keys].service_type === 'orderer') {
                const orderUrl = `${serviceEndpoints[keys].service_ip}:${serviceEndpoints[keys].service_port}`;
                const ordererDomain = serviceEndpoints[keys].service_name.split('.').slice(1).join('.');
                orderers[serviceEndpoints[keys].service_name] = {
                    grpcOptions: { 'ssl-target-name-override': serviceEndpoints[keys].service_name },
                    tlsCACerts: { path: `/opt/fabric/${networkId}/crypto-config/ordererOrganizations/${ordererDomain}/orderers/${serviceEndpoints[keys].service_name}/tls/ca.crt` },
                    url: `grpcs://${orderUrl}`,
                };
                
                channels.orderers.push(serviceEndpoints[keys].service_name);
            } else if ((serviceEndpoints[keys].service_type === 'peer') && (peer_orgsName.includes(serviceEndpoints[keys].service_name.split('.').slice(1).join('.')) === true)) {
                const orgNameDomain = serviceEndpoints[keys].service_name.split('.').slice(1).join('.');
                const orgName = serviceEndpoints[keys].service_name.split('.').slice(1)[0];
                let usertmp = '';
                if (curOrg === orgName) {
                    if (userName.split('@')[0] === 'Admin') {
                        usertmp = 'admin'
                    }
                    else {
                        usertmp = userName
                    }
                }
                else {
                    for (let index = 0; index < signedusers.length;index++) {
                        if (signedusers[index].split('@')[1].split('.')[0] === orgName) {
                            if (signedusers[index].split('@')[0] === 'Admin') {
                                usertmp = 'admin'
                            }
                            else {
                                usertmp = signedusers[index];
                            }
                            break;
                        }
                    }
                }
                
                if (orgMspNames.includes(serviceEndpoints[keys].org_config_name) === false) {
                    orgConfigSequence += 1;
                    peerOrgs[orgConfigSequence] = {};
                    orgMspNames.push(serviceEndpoints[keys].org_config_name);
                }
                
                const admin_sk = fs.readdirSync(`/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/users/Admin@${orgNameDomain}/msp/keystore`);
                organizations[`${orgName}`] = {
                    adminPrivateKey: {
                        path: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/users/Admin@${orgNameDomain}/msp/keystore/${admin_sk[0]}`,
                    },
                    certificateAuthorities: [`ca-${orgName}`],
                    mspid: serviceEndpoints[keys].org_config_mspid,
                    signedCert: {
                        path: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/users/Admin@${orgNameDomain}/msp/signcerts/Admin@${orgNameDomain}-cert.pem`,
                    },
                };
                
                certificateAuthorities[`ca-${orgName}`] = {
                    caName: `ca-${orgName}`,
                    httpOptions: {
                        verify: false,
                    },
                    registrar: [
                        {
                            enrollId: 'admin',
                            enrollSecret: 'adminpw',
                        },
                    ],
                    tlsCACerts: {
                        path: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/ca/ca.${orgNameDomain}-cert.pem`,
                    },
                    url: `https://${caAddress[orgNameDomain]}`,
                };
                keyValueStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/ca/${usertmp}`;
                network[`${orgName}`] = {
                    'x-type': 'hlfv1',
                    name: `${channel.name}-${orgName}`,
                    description: `org${orgConfigSequence}`,
                    version: '1.0',
                    client: {
                        organization: `${orgName}`,
                        credentialStore: {
                            path: keyValueStorePath,
                            cryptoStore: {
                                path: keyValueStorePath,
                            },
                            wallet: 'wallet',
                        },
                    },
                };
            }
        }
        
        const channelsConfig = {};
        channelsConfig[`${channel.name}`] = channels;
        
        network = Object.assign(network, {
            config: {
                version: '1.0',
                'x-type': 'hlfv1',
                name: `${channel.name}`,
                description: `${channel.name}`,
                orderers,
                certificateAuthorities,
                organizations,
                // peers,
                channels: channelsConfig,
            },
        });
        console.log(network);
        return network;
    }
    
    async networkAddPeersForSignup(channelId, network, peersServiceName) {
        const { ctx } = this;
        
        const channel = await ctx.model.Channel.findOne({ _id: channelId });
        const peer_orgs = channel.peer_orgsName;
        const serviceEndpoints = await ctx.model.ServiceEndpoint.find({ channel: channelId });
        const networkId = serviceEndpoints[0].networkid;
        
        const peer_orgsName = [];
        const peers = {};
        const peerNames = [];
        const channelsPeers = {};
        for (let i = 0; i < peer_orgs.length; i++) {
            peer_orgsName.push(peer_orgs[i].name);
        }
        
        for (const keys in serviceEndpoints) {
            
            if ((serviceEndpoints[keys].service_type === 'peer') && (peer_orgsName.includes(serviceEndpoints[keys].service_name.split('.').slice(1).join('.')) === true)) {
                let exist = false;
                let index = 0;
                for (;index < peersServiceName.length;index++) {
                    if (peersServiceName[index].name === serviceEndpoints[keys].service_name) {
                        exist = true;
                        break;
                    }
                }
                if (exist) {
                    const orgName = serviceEndpoints[keys].service_name.split('.').slice(1)[0];
                    const orgNameDomain = serviceEndpoints[keys].service_name.split('.').slice(1).join('.');
                    peerNames.push(serviceEndpoints[keys].service_name);
                    
                    peers[serviceEndpoints[keys].service_name] = {
                        eventUrl: `grpcs://${serviceEndpoints[keys].event}`,
                        grpcOptions: {
                            'ssl-target-name-override': serviceEndpoints[keys].service_name,
                        },
                        tlsCACerts: {
                            path: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgNameDomain}/peers/${serviceEndpoints[keys].service_name}/tls/ca.crt`,
                        },
                        url: `grpcs://${serviceEndpoints[keys].grpc}`,
                    };
                    if (typeof(network.config.organizations[`${orgName}`]) === 'undefined') {
                        network.config.organizations[`${orgName}`] = {};
                    }
                    network.config.organizations[`${orgName}`].peers = peerNames;
                    
                    // let peerId = parseInt(serviceEndpoints[keys].service_name.split('.').slice(0)[0].charAt(serviceEndpoints[keys].service_name.split('.').slice(0)[0].length - 1));
                    channelsPeers[serviceEndpoints[keys].service_name] = {
                        chaincodeQuery: peersServiceName[index].roles.chaincodeQuery,
                        endorsingPeer: peersServiceName[index].roles.endorsingPeer,
                        eventSource: true,
                        ledgerQuery: peersServiceName[index].roles.ledgerQuery
                    };
                }
            }
        }
        
        network.config.channels[`${channel.name}`].peers = channelsPeers;
        
        network.config.peers = peers;
        
        console.log(network);
        return network;
    }
    
    async configtxYamlAddChannelProfile(peerOrgsDict, name, fabricFilePath, version) {
        try {
            const Va = version.split('-').slice(1)[0];
            const Vb = 'V' + Va.replace('.', '_');
            console.log(Vb);
            const data = yaml.readSync(`${fabricFilePath}/configtx.yaml`);
            console.log(data);
            const ListPeerOrganizations = [];
            // 从组织中将peer组织筛选出来，并根据组织名组成组织MSP
            const peerMSP = [];
            let peerName;
            for (const each in peerOrgsDict) {
                if (peerOrgsDict[each].type === 'peer') {
                    peerName = peerOrgsDict[each].name;
                    peerMSP.push(peerName.substring(0, 1).toUpperCase() + peerName.substring(1) + 'MSP');
                }
            }
            // 跟模板中的信息对比，对上之后，将peer组织模板推到列表中
            for (const MSPID in peerMSP) {
                for (const orgProfileId in data.Organizations) {
                    if (peerMSP[MSPID] === data.Organizations[orgProfileId].ID) {
                        ListPeerOrganizations.push(data.Organizations[orgProfileId]);
                    }
                }
            }
            
            data.Profiles[`${name}OrgsChannel`] = { Application: { Capabilities: {}, Organizations: ListPeerOrganizations }, Consortium: 'SampleConsortium' };
            //data.Profiles[`${name}OrgsChannel`].Application.Capabilities[`${Vb}`] = true;
            data.Profiles[`${name}OrgsChannel`].Application.Capabilities.V1_1 = true;
            
            console.log('new configtx.yaml: \r\n');
            console.log(data);
            yaml.writeSync(`${fabricFilePath}/configtx.yaml`, data);
            
        } catch (err) {
            console.log('failed for reason :', err);
            throw new Error('\r\n create configtx.yaml for OrgsChannelProfile failed');
        }
    }
    
    async generateNetwork(channelId, chainType = 'fabric-1.1', userName = this.ctx.req.user.username) {
        switch (chainType) {
            case 'fabric-1.0':
                return await this.generateNetworkFabricV1_0(channelId);
            case 'fabric-1.1':
                return await this.generateNetworkFabricV1_1(channelId);
            case 'fabric-1.4':
            default:
                return await this.generateNetworkFabricV1_4(channelId, userName);
        }
    }
    
    async initialFabric(channel) {
        const { ctx, config } = this;
        try {
            const userName = ctx.req.user.username;
            const orgName = userName.split('@')[1].split('.')[0];
            // const blockNetwork = await ctx.model.Channel.findOne({_id:channel._id.toString()});
            const networkId = channel.blockchain_network_id;
            const fabricFilePath = `${config.fabricDir}/${networkId}`;
            
            const channelConfigPath = `${fabricFilePath}/${channel._id}/channel-artifacts`;
            const channelName = channel.name;
            const fabricVersion = channel.version;
            // const orgName = channel.peer_orgsName[0].name.split('.').slice(0)[0];
            
            fs.ensureDirSync(channelConfigPath);
            const fabricVerDir = fabricVer[fabricVersion];
            
            if (shell.exec(`cd ${fabricFilePath} && /opt/fabric_tools/${fabricVerDir}/configtxgen  -profile ${channel.name}OrgsChannel -channelID ${channelName} -outputCreateChannelTx ${channelConfigPath}/${channelName}.tx`).code !== 0) {
                ctx.logger.error('run failed');
                throw new Error('\r\n create configtx.yaml failed');
            }
            const network = await this.generateNetwork(channel._id.toString(), fabricVersion);
            
            if (fabricVersion === 'fabric-1.1' || fabricVersion === 'fabric-1.4' ) {
                await ctx.getRegisteredUserV1_4(network, `${orgName}Admin`, orgName, true);
            }
            
            await ctx.createChannel(network, channelName, channelConfigPath, orgName, userName, channel.version);
            await ctx.sleep(1000);
        } catch (err) {
            console.log(err.message);
            await ctx.model.Channel.remove({ _id: channel._id });
            await ctx.model.ServiceEndpoint.remove({ channel: channel._id });
            throw new Error('\r\n initialFabric failed, channel.id :' + channel._id.toString());
        }
        // await ctx.joinChannel(network, keyValueStorePath, channelName, peers, 'org1', 'fabric-1.1', 'admin');
    }
    
    async create() {
        const { ctx, config } = this;
        const userName = ctx.req.user.username;
        const opName = 'channel_create';
        const opSource = ctx.ip;
        const opObject = 'channel';
        const opDate = new Date();
        const result = {};
        const opDetails = ctx.request.body.channel;
        if (userName.split('@')[0] !== 'Admin') {
            const userInfo = await ctx.model.OrgUser.findOne({ username: userName });
            if (userInfo === null) {
                const err_message = `user ${userName} can not found in db`;
                result.message = err_message;
                result.success = false;
                result.code = 400;
                await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, 400, opDetails, {}, err_message);
                return result;
            }
            const userCreateTime = userInfo.create_time;
            const userExpirationDateStr = userInfo.expiration_date;
            const ifValidity = await ctx.service.user.getCertiExpirationState(userCreateTime, userExpirationDateStr);
            if (ifValidity === false) {
                const err_message = userName + ' certificate has become invalid , need to reenroll';
                result.success = false;
                result.code = 400;
                result.message = err_message;
                await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, result.code, opDetails, {}, err_message);
                return result;
            }
            if (userInfo.roles === 'org_user') {
                const err_message = '403 forbidden, the operator user\'s role is org_user, create channel only can be operated by org_admin';
                console.log(err_message);
                
                result.success = false;
                result.code = 400;
                result.message = err_message;
                await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, result.code, opDetails, {}, err_message);
                return result;
            }
        }
        const { name, description, orderer_url, peer_orgs } = ctx.request.body.channel;
        const resChannel = {
            name,
            description,
            orderer_url,
            peer_orgs,
        };
        
        try {
            const orgUrl = 'http://operator-dashboard:8071/v2/organizations';
            const orgResponse = await ctx.curl(orgUrl, {
                method: 'GET',
            });
            
            let networkId;
            if (orgResponse.status === 200) {
                const data = JSON.parse(orgResponse.data.toString());
                const organizations = data.organizations;
                const peer_orgsName = [];
                const peerOrgsDict = [];
                // For the configtx.yaml file add OrgsChannel Profile.
                for (const each in organizations) {
                    if (peer_orgs.includes(organizations[each].id) === true) {
                        peer_orgsName.push({
                            name: `${organizations[each].name}.${organizations[each].domain}`,
                            id: `${organizations[each].id}`,
                        });
                        networkId = organizations[each].blockchain_network_id;
                        peerOrgsDict.push(organizations[each]);
                    }
                }
                
                let fabricVersion;
                const networkUrl = `http://operator-dashboard:8071/v2/blockchain_networks/${networkId}`;
                const networkResponse = await ctx.curl(networkUrl, {
                    method: 'GET',
                });
                if (networkResponse.status === 200) {
                    const dataNet = JSON.parse(networkResponse.data.toString());
                    
                    fabricVersion = `fabric-${dataNet.blockchain_network.fabric_version.substr(1, 3)}`;
                    console.log(fabricVersion);
                }
                
                const fabricFilePath = `${config.fabricDir}/${networkId}`;
                await this.configtxYamlAddChannelProfile(peerOrgsDict, name, fabricFilePath, fabricVersion);
                
                const date = new Date();
                const channel = await ctx.model.Channel.create({
                    name,
                    description,
                    orderer_url,
                    peer_orgsName,
                    version: fabricVersion,
                    creator_id: ctx.user.id,
                    creator_name: ctx.user.username,
                    blockchain_network_id: networkId,
                    date,
                });
                
                await this.initialFabric(channel);
                resChannel.message = 'create Channel success';
                resChannel.success = true;
                resChannel.code = 200;
            }
        } catch (err) {
            console.log(err.message);
            resChannel.message = 'some error happened, create Channel failed,err: ' + err.message;
            resChannel.success = false;
            resChannel.code = 400;
        }
        await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, resChannel.code, opDetails, {}, resChannel.message);
        return resChannel;
    }
    
    async inviteOrg(){
        const { ctx, config } = this;
        const channelId = ctx.params.channel_id;
        const channeldb = await ctx.model.Channel.findOne({ _id: channelId });
        const networkType = channeldb.version;
        const userName = ctx.req.user.username;
        const curOrg = userName.split('@')[1].split('.')[0];
        const inviteOrg = {
        };
        
        try {
            const channelName = channeldb.name;
            const network = await this.generateNetwork(channeldb._id.toString(),networkType);
            const peersForChannel = channeldb.peers_inChannel;
            await this.generateNetworkAddPeersV1_1(channelId, network, peersForChannel);
            const organizations = ctx.request.body.peer_orgs;
            const ordererOrgs = null;
            const blockchain_network_id = channeldb.blockchain_network_id;
            const orgUrl = `http://operator-dashboard:8071/v2/blockchain_networks/${blockchain_network_id}/createyamlforneworgs`;
            const orgResponse = await ctx.curl(orgUrl, {
                // 必须指定 method
                method: 'POST',
                // 通过 contentType 告诉 HttpClient 以 JSON 格式发送
                contentType: 'json',
                data: {
                    blockchain_network: {
                        peer_orgs:organizations,
                        orderer_orgs:ordererOrgs,
                    },
                },
            });
            
            console.log('org info:'+ organizations);
            if (orgResponse.status === 200) {
                ctx.logger.debug('Successfully to createyamlforneworgs by operate-dashboard');
            }
            else{
                ctx.logger.error('failed to createyamlforneworgs by operate-dashboard');
                inviteOrg.success = false;
                return inviteOrg;
            }
            
            
            for (const each in organizations) {
                const newOrgId = organizations[each];
                
                await ctx.model.ChannelSign.create({
                    channelid:channelId,
                    orgid:newOrgId,
                });
            }
            
            ctx.logger.debug('Successfully to inviteOrg');
            
        }
        catch(err) {
            ctx.logger.debug('Failed to inviteOrg: ' + err.stack ? err.stack : err);
            console.log(err);
            inviteOrg.success = false;
        }
        inviteOrg.success = true;
        return inviteOrg;
    }
    async signOrg(){
        const { ctx, config } = this;
        const channelId = ctx.params.channel_id;
        const channeldb = await ctx.model.Channel.findOne({ _id: channelId });
        const userName = ctx.req.user.username;
        const OrgName = userName.split('@')[1].split('.')[0];
        const signOrg = {
        };
        try {
            const channelName = channeldb.name;
            const networkType = channeldb.version;
            const peersForChannel = channeldb.peers_inChannel;
            
            const organizations = ctx.request.body.peer_orgs;
            var peer_orgsName = [];
            channeldb.peer_orgsName.map(org => {
                peer_orgsName.push(
                    org
                )
            });
            for (const each in organizations) {
                const newOrgId = organizations[each];
                const ChannelSign = await ctx.model.ChannelSign.findOne({ channelid: channelId, orgid:newOrgId});
                const network = await this.generateNetworkForSignup(channeldb._id.toString(), ChannelSign.signatures);
                
                await this.networkAddPeersForSignup(channelId, network, peersForChannel);
                
                let orgResponse;
                try {
                    const orgUrl = `http://operator-dashboard:8071/v2/organizations?name=${OrgName}`;
                    orgResponse = await ctx.curl(orgUrl, {
                        method: 'GET',
                    });
                } catch (e) {
                    return {
                        peers: [],
                        message: 'get org infor fail',
                    };
                }
                
                let data;
                if (orgResponse.status === 200) {
                    data = JSON.parse(orgResponse.data.toString());
                } else {
                    const e = new Error('get organization fail.');
                    return e;
                }
                
                const curOrgId = data.organizations[0].id;
                
                const orgUrl = `http://operator-dashboard:8071/v2/organizations/${newOrgId}`;
                
                orgResponse = await ctx.curl(orgUrl, {
                    method: 'GET',
                });
                if (orgResponse.status === 200) {
                    ctx.logger.debug('Successfully to get org information by operate-dashboard');
                }
                else{
                    ctx.logger.debug('failed to get org information by operate-dashboard');
                    signOrg.success = false;
                    return signOrg;
                }
                
                data = JSON.parse(orgResponse.data.toString());
                const newOrgName = data.organization.name;
                const newOrgDomain = data.organization.domain;
                
                peer_orgsName.push({
                    name: `${newOrgName}.${newOrgDomain}`,
                    id: `${newOrgId}`,
                });
                //const networkType = 'fabric-1.4';
                //await ctx.signUpdate(network, channelName, OrgName, curOrgId, userName, channeldb, config, newOrgId, newOrgName, networkType);
                
                var signatures = [];
                var signers = [];
                
                var signedusers = ChannelSign.signatures;
                signers = ChannelSign.signers;
                signedusers.push(userName);
                signers.push(curOrgId);
                // await ctx.model.ChannelSign.updateOne({ channelid: channelId , orgid:newOrgId},{$set:{signers:signers,signatures:signatures,orgid:newOrgId}});
                
                var peerOrgNumber = channeldb.peer_orgsName.length;
                var signnumber = signers.length * 2;
                if(signnumber > peerOrgNumber){
                    const networkType = 'fabric-1.4';
                    await ctx.signUpdate(network, channelName, OrgName, curOrgId, userName, channeldb, config, newOrgId, newOrgName, signedusers, networkType);
                    
                    await ctx.model.ChannelSign.deleteOne({ channelid: channelId,orgid:newOrgId});
                    await ctx.model.Channel.updateOne({ _id: channelId },{$set:{peer_orgsName:peer_orgsName}});
                } else {
                    await ctx.model.ChannelSign.updateOne({ channelid: channelId , orgid:newOrgId},{$set:{signers:signers,signatures:signedusers,orgid:newOrgId}});
                }
            }
            
            
            ctx.logger.debug('Successfully had configtxlator compute the updated config object');
            
        }
        catch(err) {
            ctx.logger.error('Failed to update the channel: ' + err.stack ? err.stack : err);
            ctx.status = 500;
            signOrg.success = false;
            console.log(err);
            ctx.throw(500, err.message);
        }
        signOrg.success = true;
        return signOrg;
    }
    async getsigners(){
        const { ctx, config } = this;
        const channelId = ctx.params.channel_id;
        const orgsigninfo = [];
        var ChannelSign = await ctx.model.ChannelSign.find({ channelid: channelId });
        
        for (const each in ChannelSign) {
            orgsigninfo.push ({
                orgid:ChannelSign[each].orgid,
                signinfo:ChannelSign[each].signers,
            });
        }
        return {signlist:orgsigninfo, status:'success'};
    }
    async join() {
        const { ctx } = this;
        const peersServiceName = ctx.request.body.peers;
        //const peers = [];
        const channelId = ctx.params.channel_id;
        const channelInfo = await ctx.model.Channel.findOne({ _id: channelId });
        const channelName = channelInfo.name;
        const peersForChannel = channelInfo.peers_inChannel;
        const joinPeers = {
            peersServiceName,
        };
        const userName = ctx.req.user.username;
        const opName = 'channel_join';
        const opSource = ctx.ip;
        const opObject = 'channel';
        const opDate = new Date();
        const result = {};
        const opDetails = ctx.request.body.peers;
        opDetails.channel_id = channelId;
        const orgName = userName.split('@')[1].split('.')[0];
        if (userName.split('@')[0] !== 'Admin') {
            const userInfo = await ctx.model.OrgUser.findOne({ username: userName });
            if (userInfo === null) {
                const error_message = `user ${userName} can not found in db`;
                result.success = false;
                result.code = 400;
                result.message = error_message;
                await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, 400, opDetails, {}, error_message);
                return result;
            }
            const userCreateTime = userInfo.create_time;
            const userExpirationDateStr = userInfo.expiration_date;
            const ifValidity = await ctx.service.user.getCertiExpirationState(userCreateTime, userExpirationDateStr);
            if (ifValidity === false) {
                const error_message = userName + ' certificate has become invalid , need to reenroll';
                result.success = false;
                result.code = 400;
                result.message = error_message;
                await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, result.code, opDetails, {}, error_message);
                return result;
            }
            
            if (userInfo.roles === 'org_user') {
                const error_message = '403 forbidden, the operator user\'s role is org_user, join channel only can be operated by org_admin';
                console.log(error_message);
                result.success = false;
                result.code = 400;
                result.message = error_message;
                await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, result.code, opDetails, {}, error_message);
                return result;
            }
        }
        
        const networkType = channelInfo.version;
        const peerNames = [];
        let code;
        let errorMsg = '';
        let each;
        try {
            //for (const each in peersServiceName) {
            for(each =0;each < peersServiceName.length; each++ ){
                //peers.push(peersServiceName[each].split('.').slice(0)[0]);
                let exist = false;
                for (let index = 0;index < peersForChannel;index++) {
                    if (peersForChannel[index].name === peersServiceName[each].name) {
                        exist = true;
                        break;
                    }
                }
                if (!exist) {
                    peersForChannel.push({
                        name: peersServiceName[each].name,
                        roles: {
                            chaincodeQuery: peersServiceName[each].roles.chaincodeQuery,
                            endorsingPeer: peersServiceName[each].roles.endorsingPeer,
                            ledgerQuery: peersServiceName[each].roles.ledgerQuery
                        }
                    });
                    peerNames.push(peersServiceName[each].name);
                }
            }
            const network = await this.generateNetwork(channelInfo._id.toString(),networkType);
            await this.generateNetworkAddPeersV1_1(channelInfo._id.toString(), network, peersForChannel);
            await ctx.joinChannel(network, channelName, peerNames, orgName, networkType, userName);
            await ctx.model.Channel.findOneAndUpdate(
                { _id: channelId }, { peers_inChannel: peersForChannel },
                { upsert: true });
            joinPeers.success = true;
            joinPeers.code = 200;
            
        } catch (err) {
            console.log(err.message);
            joinPeers.success = false;
            joinPeers.code = 400;
            errorMsg = err.message;
        }
        
        await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, joinPeers.code, opDetails, {}, errorMsg);
        return joinPeers;
    }
    
    async appQuery(functionName, args, channelId, chaincodeId) {
        const { ctx } = this;
        const jwtToken = ctx.req.headers.authorization;
        const SSOConfig = JSON.parse(fs.readFileSync('/opt/SSOConfig/SSOServer.json', 'utf-8'));
        const reqUrl = SSOConfig.server_url + "?" + SSOConfig.key + "=" + jwtToken;
        const response = await ctx.curl(reqUrl, {
            method: SSOConfig.method,
            dataType: 'json',
        });
        
        if (response.status !== 200) {
            return {
                success: false,
                message: 'request SSO for check token fail.'
            };
        }
        const SSOUser = response.data[SSOConfig.name_key];
        const reg = /\w/;
        
        if (SSOUser === null || !reg.test(SSOUser))
        {
            return {
                success: false,
                message: 'SSO user name is null or empty'
            };
        }
        
        const userInfo = await ctx.model.OrgUser.findOne({ SSOUser: SSOUser });
        if (userInfo === null) {
            return {
                success: false,
                message: `user ${userName} have not register in cello.`
            };
        }
        
        return this.queryChainCode(userInfo.username, functionName, args, channelId, chaincodeId);
    }
    
    async queryChainCode(userName, functionName, args, channelId, chaincodeId) {
        const { ctx } = this;
        const orgName = userName.split('@')[1].split('.')[0];
        if (userName.split('@')[0] !== 'Admin') {
            const userInfo = await ctx.model.OrgUser.findOne({ username: userName });
            if (userInfo === null) {
                const err_message = `user ${userName} can not found in db`;
                throw new Error(err_message);
            }
            const userCreateTime = userInfo.create_time;
            const userExpirationDateStr = userInfo.expiration_date;
            const ifValidity = await ctx.service.user.getCertiExpirationState(userCreateTime, userExpirationDateStr);
            if (ifValidity === false) {
                const err_message = userName + ' certificate has become invalid , need to reenroll';
                const result1 = {};
                result1.success = false;
                result1.code = 400;
                result1.message = err_message;
                return result1;
            }
        }
        
        const channelInfo = await ctx.model.Channel.findOne({ _id: channelId });
        const chainCode = await ctx.model.ChainCode.findOne({ _id: chaincodeId });
        const peers = [];
        const peerName = [];
        const networkType = channelInfo.version;
        const network = await this.generateNetwork(channelId,networkType, userName);
        // 找到通道内安装链码的节点
        for (let i = 0; i < chainCode.peers.length; i++) {
            for (let j = 0; j < channelInfo.peers_inChannel.length; j++) {
                if (chainCode.peers[i].peer_name === channelInfo.peers_inChannel[j].name
                    && channelInfo.peers_inChannel[j].roles.chaincodeQuery
                ) {
                    peers.push(channelInfo.peers_inChannel[j]);
                    peerName.push(channelInfo.peers_inChannel[j].name);
                    break;
                }
            }
        }
        
        await this.generateNetworkAddPeersV1_1(channelId, network, peers);
        const result = await ctx.queryChainCode(network, peerName, channelInfo.name, chainCode.name, functionName, args, userName, orgName, channelInfo.version);
        if (!result.success) {
            console.log(result.message);
        }
        return result;
    }
    
    async appInvoke(functionName, argsArr, channelId, chaincodeId) {
        const { ctx } = this;
        const opName = 'app_chaincode_invoke';
        const opSource = ctx.ip;
        const opObject = 'chaincode';
        const opDate = new Date();
        const result = {};
        const opDetails = ctx.request.body.chaincode_operation;
        const jwtToken = ctx.req.headers.authorization;
        const SSOConfig = JSON.parse(fs.readFileSync('/opt/SSOConfig/SSOServer.json', 'utf-8'));
        const reqUrl = SSOConfig.server_url + "?" + SSOConfig.key + "=" + jwtToken;
        const response = await ctx.curl(reqUrl, {
            method: SSOConfig.method,
            dataType: 'json',
        });
        
        if (response.status !== 200) {
            const err_message = `request SSO for check token fail.`;
            result.success = false;
            result.code = 400;
            result.message = err_message;
            await ctx.service.log.deposit(opName, opObject, opSource, 'unknown', opDate, 400, opDetails, {}, err_message);
            return result;
        }
        const SSOUser = response.data[SSOConfig.name_key];
        const reg = /\w/;
        
        if (SSOUser === null || !reg.test(SSOUser))
        {
            const err_message = `SSO user name is null or empty`;
            result.success = false;
            result.code = 400;
            result.message = err_message;
            await ctx.service.log.deposit(opName, opObject, opSource, 'unknown', opDate, 400, opDetails, {}, err_message);
            return result;
        }
        
        const userInfo = await ctx.model.OrgUser.findOne({ SSOUser: SSOUser });
        if (userInfo === null) {
            const err_message = `user ${SSOUser} have not register in cello.`;
            result.success = false;
            result.code = 400;
            result.message = err_message;
            await ctx.service.log.deposit(opName, opObject, opSource, 'unknown', opDate, 400, opDetails, {}, err_message);
            return result;
        }
        
        const name = userInfo.username;
        return this.invoke(name, functionName, argsArr, channelId, chaincodeId);
    }
    
    async invoke(userName, functionName, args, channelId, chaincodeId) {
        const { ctx } = this;
        const opName = 'chaincode_invoke';
        const opSource = ctx.ip;
        const opObject = 'chaincode';
        const opDate = new Date();
        const result1 = {};
        const opDetails = ctx.request.body.chaincode_operation;
        opDetails.channel_id = channelId;
        const orgName = userName.split('@')[1].split('.')[0];
        if (userName.split('@')[0] !== 'Admin') {
            const userInfo = await ctx.model.OrgUser.findOne({ username: userName });
            if (userInfo === null) {
                const err_message = `user ${userName} can not found in db`;
                result1.success = false;
                result1.code = 400;
                result1.message = err_message;
                await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, 400, opDetails, {}, err_message);
                return result1;
                
            }
            const userCreateTime = userInfo.create_time;
            const userExpirationDateStr = userInfo.expiration_date;
            const ifValidity = await ctx.service.user.getCertiExpirationState(userCreateTime, userExpirationDateStr);
            if (ifValidity === false) {
                const err_message = userName + ' certificate has become invalid , need to reenroll';
                result1.success = false;
                result1.code = 400;
                result1.message = err_message;
                await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, 400, opDetails, {}, err_message);
                return result1;
            }
        }
        const channelInfo = await ctx.model.Channel.findOne({ _id: channelId });
        const chainCode = await ctx.model.ChainCode.findOne({ _id: chaincodeId });
        const peers = [];
        const peerName = [];
        const networkType = channelInfo.version;
        const network = await this.generateNetwork(channelId,networkType, userName);
        // 找到通道内安装链码的节点
        for (let i = 0; i < chainCode.peers.length; i++) {
            for (let j = 0; j < channelInfo.peers_inChannel.length; j++) {
                if (chainCode.peers[i].peer_name === channelInfo.peers_inChannel[j].name) {
                    if (channelInfo.peers_inChannel[j].roles.endorsingPeer) {
                        peers.push(channelInfo.peers_inChannel[j]);
                        peerName.push(channelInfo.peers_inChannel[j].name);
                        break;
                    }
                }
            }
        }
        
        await this.generateNetworkAddPeersV1_1(channelId, network, peers);
        let code = 200;
        // the peer must be the endorsing peer.
        const recovery = {
            chaincodeId,
            channelId,
            recoveryChaincode: ctx.service.chainCode.recoveryChaincode,
            ctx,
            config: this.config,
        };
        const result = await ctx.invokeChainCode(network, peerName, channelInfo.name, chainCode.name, functionName, args, userName, orgName, channelInfo.version, recovery);
        if (!result.success) {
            console.log(result.message);
            code = 400;
        }
        
        await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, code, opDetails, {}, result.message);
        return result;
    }
    
    async removeOrgFromChannel() {
        const { ctx, config } = this;
        const channelId = ctx.params.channel_id;
        const channeldb = await ctx.model.Channel.findOne({ _id: channelId });
        const userName = ctx.req.user.username;
        const OrgName = userName.split('@')[1].split('.')[0];
        const signOrg = {};
        
        try {
            const channelName = channeldb.name;
            const targetOrgId = ctx.request.body.peer_org;
            const ChannelSign = await ctx.model.RemoveOrgFromChannelSign.findOne({ channelid: channelId, orgid:targetOrgId});
            const network = await this.generateNetworkForSignup(channeldb._id.toString(), ChannelSign.signatures);
            const peersForChannel = [];
            channeldb.peers_inChannel.map(peer => {
                peersForChannel.push(peer);
            });
            await this.networkAddPeersForSignup(channelId, network, peersForChannel);
            
            const peer_orgsName = [];
            channeldb.peer_orgsName.map(org => {
                peer_orgsName.push(
                    org
                )
            });
            
            let orgResponse;
            try {
                const orgUrl = `http://operator-dashboard:8071/v2/organizations?name=${OrgName}`;
                orgResponse = await ctx.curl(orgUrl, {
                    method: 'GET',
                });
            } catch (e) {
                return {
                    success: false,
                    message: 'get org infor fail'
                };
            }
            
            let data;
            if (orgResponse.status === 200) {
                data = JSON.parse(orgResponse.data.toString());
            } else {
                const e = new Error('get organization fail.');
                return {
                    success: false,
                    message: e
                };
            }
            
            const curOrgId = data.organizations[0].id;
            
            const orgUrl = `http://operator-dashboard:8071/v2/organizations/${targetOrgId}`;
            
            orgResponse = await ctx.curl(orgUrl, {
                method: 'GET',
            });
            if (orgResponse.status === 200) {
                ctx.logger.debug('Successfully to get org information by operate-dashboard');
            }
            else{
                ctx.logger.debug('failed to get org information by operate-dashboard');
                signOrg.success = false;
                return signOrg;
            }
            
            data = JSON.parse(orgResponse.data.toString());
            const targetOrgName = data.organization.name;
            
            for (let i = 0;i < peer_orgsName.length;i++) {
                if (peer_orgsName[i].id === targetOrgId) {
                    peer_orgsName.splice(i, 1);
                    break;
                }
            }
            const resPeers = [];
            for (let i = 0;i < peersForChannel.length;i++) {
                if (peersForChannel[i].name.split('.')[1] !== targetOrgName) {
                    resPeers.push(peersForChannel[i]);
                }
            }
            
            const signedusers = ChannelSign.signatures;
            const signers = ChannelSign.signers;
            signedusers.push(userName);
            signers.push(curOrgId);
            
            const peerOrgNumber = channeldb.peer_orgsName.length;
            const signnumber = signers.length * 2;
            
            //有一半以上组织签名，并且本组织同意退出当前通道，则执行退出
            if(signnumber > peerOrgNumber && signers.includes(targetOrgId)){
                const networkType = 'fabric-1.4';
                await ctx.removeOrgFromChannel(network, channelName, OrgName, curOrgId, userName, channeldb, config, targetOrgId, targetOrgName, signedusers, networkType);
                
                await ctx.model.RemoveOrgFromChannelSign.deleteOne({ channelid: channelId,orgid:targetOrgId});
                await ctx.model.Channel.updateOne({ _id: channelId },{$set:{peer_orgsName:peer_orgsName, peers_inChannel: resPeers}});
                console.log('-------------remove-----------------');
            } else {
                await ctx.model.RemoveOrgFromChannelSign.updateOne({ channelid: channelId , orgid:targetOrgId},{$set:{signers:signers,signatures:signedusers,orgid:targetOrgId}});
            }
            
            ctx.logger.debug('Successfully had configtxlator compute the updated config object');
        }
        catch(err) {
            ctx.logger.error('Failed to update the channel: ' + err.stack ? err.stack : err);
            ctx.status = 500;
            signOrg.success = false;
            console.log(err);
            ctx.throw(500, err.message);
        }
        signOrg.success = true;
        return signOrg;
    }
    
    async applyForLeaveChannel() {
        const { ctx } = this;
        const channelId = ctx.params.channel_id;
        const channeldb = await ctx.model.Channel.findOne({ _id: channelId });
        const userName = ctx.req.user.username;
        const curOrg = userName.split('@')[1].split('.')[0];
        
        let orgResponse;
        try {
            const orgUrl = `http://operator-dashboard:8071/v2/organizations?name=${curOrg}`;
            orgResponse = await ctx.curl(orgUrl, {
                method: 'GET',
            });
        } catch (e) {
            return {
                success: false,
                message: 'get org infor fail'
            };
        }
        
        let data;
        if (orgResponse.status === 200) {
            data = JSON.parse(orgResponse.data.toString());
        } else {
            return {
                success: false,
                message: 'get organization fail.'
            };
        }
        
        const curOrgId = data.organizations[0].id;
        
        await ctx.model.RemoveOrgFromChannelSign.create({
            channelid: channelId,
            orgid: curOrgId,
        });
        return {
            success: true
        };
    }
    
    async getLeaveChannelsigners() {
        const { ctx } = this;
        const channelId = ctx.params.channel_id;
        const orgsigninfo = [];
        var ChannelSign = await ctx.model.RemoveOrgFromChannelSign.find({ channelid: channelId });
        
        for (const each in ChannelSign) {
            orgsigninfo.push ({
                orgid:ChannelSign[each].orgid,
                signinfo:ChannelSign[each].signers,
            });
        }
        return {
            signlist:orgsigninfo,
            success: true
        }
    }
    
    
    async updateSysChannelInfo(){
        const { ctx,config } = this;
        //获取系统channel config,
        const networkId = ctx.params.network_id;
        const channelName = config.default.sysChannelName;
        const service_object = ctx.req.body.sysChannel.service_object;
        const organizations_object = ctx.req.body.sysChannel.organizations_object;
        const peer_org_dicts = ctx.req.body.sysChannel.peer_org_dicts;
        
        let channelInfo = await this.getChannelInfo(networkId, channelName, service_object, organizations_object, peer_org_dicts);
        
        if(channelInfo){
            channelInfo.success = true;
            console.log("success.");
        }
        return channelInfo;
    }
    
    async updateSysChannelOrdererInfo(){
        const { ctx,config } = this;
        //获取系统channel config,
        const networkId = ctx.params.network_id;
        const channelName = config.default.sysChannelName;
        const service_object = ctx.req.body.sysChannel.service_object;
        const organizations_object = ctx.req.body.sysChannel.organizations_object;
        const orderer_org_dicts = ctx.req.body.sysChannel.orderer_org_dicts;
        const request_host_ports = ctx.req.body.sysChannel.request_host_ports;
        
        let channelInfo = await this.getChannelOrdererInfo(networkId, channelName, service_object, organizations_object, orderer_org_dicts,request_host_ports);
        
        if(channelInfo){
            channelInfo.success = true;
            console.log("success.");
        }
        return channelInfo;
    }
    
    async getChannelInfo(networkId, channelName, service_object, organizations_object, peer_org_dicts){
        const { ctx } = this;
        const network = await this.generateNetworkForSysChannel(networkId, channelName, service_object);
        const result = await ctx.getChannelInfo(network, networkId, channelName, organizations_object, peer_org_dicts);
        console.log(result);
        return result;
    }
    
    async getChannelOrdererInfo(networkId, channelName, service_object, organizations_object, orderer_org_dicts,request_host_ports){
        const { ctx } = this;
        const network = await this.generateNetworkForSysChannel(networkId, channelName, service_object);
        const result = await ctx.getChannelOrdererInfo(network, networkId, channelName, organizations_object, orderer_org_dicts,request_host_ports);
        console.log(result);
        return result;
    }
    
    async generateNetworkForSysChannel(networkId, channelName, service_object){
        const { ctx,config } = this;
        
        let  dataEnpoints = service_object ;
        const orderers = {};
        const certificateAuthorities = {};
        const organizations = {};
        const caAddress = {};
        const channels = {
            orderers: [],
        };
        let orderOrgNames = {};
        let network = {};
        const peerNames = [];
        
        for (const keys in dataEnpoints) {
            if (dataEnpoints[keys].service_type === 'ca') {
                caAddress[dataEnpoints[keys].service_name.split('.').slice(1).join('.')] = `${dataEnpoints[keys].service_ip}:${dataEnpoints[keys].service_port}`;
            }
        }
        for (const keys in dataEnpoints) {
            if (dataEnpoints[keys].service_type === 'orderer') {
                let orderer = dataEnpoints[keys].service_name;
                const orderUrl = `${dataEnpoints[keys].service_ip}:${dataEnpoints[keys].service_port}`;
                let orderOrgName = dataEnpoints[keys].org_name;
                let orderOrgAndDomain = dataEnpoints[keys].service_name.split('.').slice(1).join('.');
                orderOrgNames[orderOrgName] = {};
                orderOrgNames[orderOrgName]["orderer"] = orderer;
                orderOrgNames[orderOrgName]["orderOrgAndDomain"] = orderOrgAndDomain;
                const admin_sk = fs.readdirSync(`/opt/fabric/${networkId}/crypto-config/ordererOrganizations/${orderOrgAndDomain}/users/Admin@${orderOrgAndDomain}/msp/keystore`);
                const orgMspName = orderOrgName.substring(0, 1).toUpperCase() + orderOrgName.substring(1);
                const orgConfigMspId = `${orgMspName}MSP`;
                orderers[dataEnpoints[keys].service_name] = {
                    grpcOptions: { 'ssl-target-name-override': dataEnpoints[keys].service_name },
                    tlsCACerts: { path: `${config.fabricDir}/${networkId}/crypto-config/ordererOrganizations/${orderOrgAndDomain}/orderers/${dataEnpoints[keys].service_name}/tls/ca.crt` },
                    url: `grpcs://${orderUrl}`,
                };
                organizations[`${orderOrgName}`] = {
                    adminPrivateKey: {
                        path: `${config.fabricDir}/${networkId}/crypto-config/ordererOrganizations/${orderOrgAndDomain}/users/Admin@${orderOrgAndDomain}/msp/keystore/${admin_sk[0]}`,
                    },
                    certificateAuthorities: [`ca-${orderOrgName}`],
                    mspid: orgConfigMspId,
                    signedCert: {
                        path: `${config.fabricDir}/${networkId}/crypto-config/ordererOrganizations/${orderOrgAndDomain}/users/Admin@${orderOrgAndDomain}/msp/signcerts/Admin@${orderOrgAndDomain}-cert.pem`,
                    },
                };
                channels.orderers.push(dataEnpoints[keys].service_name);
            }else if (dataEnpoints[keys].service_type === 'peer'){
                const orgName = dataEnpoints[keys].service_name.split('.').slice(1)[0];
                const orgAndDomain = dataEnpoints[keys].service_name.split('.').slice(1).join('.');
                const admin_sk = fs.readdirSync(`/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgAndDomain}/users/Admin@${orgAndDomain}/msp/keystore`);
                peerNames.push(dataEnpoints[keys].service_name);
                const orgMspName = orgName.substring(0, 1).toUpperCase() + orgName.substring(1);
                const orgConfigMspId = `${orgMspName}MSP`;
                
                organizations[`${orgName}`] = {
                    adminPrivateKey: {
                        path: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgAndDomain}/users/Admin@${orgAndDomain}/msp/keystore/${admin_sk[0]}`,
                    },
                    certificateAuthorities: [`ca-${orgName}`],
                    mspid: orgConfigMspId,
                    signedCert: {
                        path: `/opt/fabric/${networkId}/crypto-config/peerOrganizations/${orgAndDomain}/users/Admin@${orgAndDomain}/msp/signcerts/Admin@${orgAndDomain}-cert.pem`,
                    },
                };
                
                certificateAuthorities[`ca-${orgName}`] = {
                    caName: `ca-${orgName}`,
                    httpOptions: {
                        verify: false,
                    },
                    registrar: [
                        {
                            enrollId: 'admin',
                            enrollSecret: 'adminpw',
                        },
                    ],
                    tlsCACerts: {
                        path: `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgAndDomain}/ca/ca.${orgAndDomain}-cert.pem`,
                    },
                    url: `https://${caAddress[orgAndDomain]}`,
                };
                
                const keyValueStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgAndDomain}/ca/Admin@${orgAndDomain}`;
                network[`${orgName}`] = {
                    'x-type': 'hlfv1',
                    name: `${channelName}-${orgName}`,
                    description: `org`,
                    version: '1.0',
                    client: {
                        organization: `${orgName}`,
                        credentialStore: {
                            path: keyValueStorePath,
                            cryptoStore: {
                                //path: keyValueStorePath,
                                path: keyValueStorePath,
                            },
                            wallet: 'wallet',
                        },
                    },
                };
            }
        }
        
        console.log(orderOrgNames);
        for(let orderOrg in orderOrgNames){
            const keyValueStorePath = `${config.fabricDir}/${networkId}/crypto-config/ordererOrganizations/${orderOrgNames[orderOrg]['orderOrgAndDomain']}/orderers/${orderOrgNames[orderOrg]['orderer']}/msp/admincerts`;
            
            network[orderOrg] = {
                'x-type': 'hlfv1',
                name: `${channelName}-${orderOrg}`,
                description: `org`,
                version: '1.0',
                client: {
                    organization: orderOrg,
                    credentialStore: {
                        path: keyValueStorePath,
                        cryptoStore: {
                            path: keyValueStorePath,
                        },
                        wallet: 'wallet',
                    },
                },
            };
        }
        
        const channelsConfig = {};
        channelsConfig[channelName] = channels;
        network = Object.assign(network, {
            config: {
                version: '1.0',
                'x-type': 'hlfv1',
                name: channelName,
                description: channelName,
                orderers,
                certificateAuthorities,
                organizations,
                // peers,
                channels: channelsConfig,
            },
        });
        
        return network;
    }
}

module.exports = ChannelService;
