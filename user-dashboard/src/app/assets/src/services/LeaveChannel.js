import { stringify } from 'qs';
import request from '../utils/request';


export async function querySignInfo(params) {
    return request(`/v2/channels/${params}/getleavesignifo`);
}

export async function agree(params) {
    return request(`/v2/channels/${params.channelId}/signforleave`, {
        method: 'POST',
        body: {
            peer_org: params.peer_org
        },
    });
}

export async function applyForLeave(params) {
    return request(`/v2/channels/${params.channelId}/applyforleave`, {
        method: 'POST',
    });
}

