import { stringify } from 'qs';
import request from '../utils/request';


export async function querySignInfo(params) {
    return request(`/v2/channels/${params}/getsignifo`);
}

export async function agree(params) {
    return request(`/v2/channels/${params.channelId}/signOrg`, {
        method: 'POST',
        body: {
            peer_orgs: params.peer_orgs
        },
    });
}

export async function addOrgExpand(params) {
    return request(`/v2/channels/${params.channelId}/inviteOrg`, {
        method: 'POST',
        body: {
            peer_orgs: params.peer_orgs
        },
    });
}

