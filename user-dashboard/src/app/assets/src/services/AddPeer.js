import { stringify } from 'qs';
import request from '../utils/request';

export async function getPeersForOrg() {
    
    return request('/v2/peers');
    
}

export async function getPeersForChannel(params) {
    return request(`/v2/peers?channel_id=${params}`);
}

export async function removeRule(params) {
    return request('/api/rule', {
        method: 'POST',
        body: {
            ...params,
            method: 'delete',
        },
    });
}

export async function addPeers(params) {
    const res = request(`/v2/channels/${params.channelId}/peerJoin`, {
        method: 'POST',
        body: {
            peers: params.peers,
        },
    });
    return res;
}

