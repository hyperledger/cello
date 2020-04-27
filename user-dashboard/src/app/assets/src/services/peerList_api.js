import { stringify } from 'qs';
import request from '../utils/request';


export async function queryChannelPeers(params) {
    // console.log(232323232);
    // console.log(`/v2/peers?channel_${stringify(params)}`);
    // console.log(232323232);
    return request(`/v2/peers?channel_${stringify(params)}`,{method:'GET'});
//    return request(`/api/getChannelDetail?${stringify(params)}`);
}

export async function queryInstantChainCode(params) {
    return request(`/api/getInstantChainCode?${stringify(params)}`);
}

export async function removeChannelDetail(params) {
    return request('/api/getChannelDetail', {
        method: 'POST',
        body: {
            ...params,
        },
    });
}

export async function addChannelDetail(params) {
    return request('/api/createChannel', {
        method: 'POST',
        body: params,
    });
}

export async function changeRole(params) {
    return request('/v2/peers/role', {
        method: 'PUT',
        body: params,
    });
}