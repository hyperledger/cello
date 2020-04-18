import request from '../utils/request';

export async function queryNetworks() {
    return request('/v2/blockchain_networks', {method: 'GET'});
}

export async function queryNetwork(params) {
    return request(`/v2/blockchain_networks/${params}`, {method: 'GET'});
}

export async function queryCpuInfo(params) {
    return request(`/v2/blockchain_networks/${params.netId}/nodeCpuInfo/${params.peerName}?start=${params.start}&end=${params.end}&step=${params.step}`, {method: 'GET'});
}

export async function queryMemoryInfo(params) {
    return request(`/v2/blockchain_networks/${params.netId}/nodeMemInfo/${params.peerName}?start=${params.start}&end=${params.end}&step=${params.step}`, {method: 'GET'});
}

export async function queryNetworkInfo(params) {
    return request(`/v2/blockchain_networks/${params.netId}/nodeNetInfo/${params.peerName}?start=${params.start}&end=${params.end}&step=${params.step}`, {method: 'GET'});
}

export async function queryNetworkHealthy(params) {
    return request(`/v2/blockchain_networks/${params}/networkhealthy`, {method: 'GET'});
}

export async function removeNetwork(params) {
    return request(`/v2/blockchain_networks/${params.netid}`, {method: 'DELETE'});
}

export async function addNetwork(params) {
    return request('/v2/blockchain_networks', {
        method: 'POST',
        body: {
            ...params,
        },
    });
}

export async function netAddOrg(params) {
    const networkID=params.networkId;
    const blockchain_network=params.blockchain_network;
    return request(`/v2/blockchain_networks/${networkID}/orgAdd`, {
        method: 'POST',
        body: {
            blockchain_network,
        },
    });
}