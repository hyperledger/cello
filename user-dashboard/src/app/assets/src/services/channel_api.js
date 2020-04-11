import { stringify } from 'qs';
import request from '../utils/request';



export async function queryChannels() {
    return request('/v2/channels', {method:'GET'});
    //   return request(`/api/getChannel?${stringify(params)}`);
}

export async function queryOneChannel(params) {
    
    return request(`/v2/channels/${params}`, {method:'GET'});
}



export async function createChannel(params) {
    return request('/v2/channels', {
        method: 'POST',
        body: {
            ...params,
        },
    });
}


