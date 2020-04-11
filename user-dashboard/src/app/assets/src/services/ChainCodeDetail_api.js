import { stringify } from 'qs';
import request from '../utils/request';



export async function queryRule() {
    return request('/v2/chaincodes', {method:'GET'});
    //  return request(`/api/getChainCodeDetail?${stringify(params)}`);
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

export async function createRule(params) {
    return request('/api/createChainCode', {
        method: 'POST',
        body:  params,
    });
}
export async function addRule(params) {
    return request('/api/rule', {
        method: 'POST',
        body: {
            ...params,
            method: 'post',
        },
    });
}


