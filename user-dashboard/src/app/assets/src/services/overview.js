/*
 SPDX-License-Identifier: Apache-2.0
*/
import { stringify } from 'qs';
import request from '../utils/request';

export async function queryStatus(params) {
    return request(`${urls.status}?${stringify(params)}`);
}

export async function queryTransactionRealtime(params) {
    return request(`/v2/txrealtime/${params.channel_id}/${params.peerName}/${params.minutes}`);
}

export async function queryBlockByNumber(params) {
    return request(`/v2/blocks/${params.channel}/${params.peerName}?number=${params.blockNum}`);
}

export async function queryBlockByTime(params) {
    return request(`/v2/blocks/${params.channel}/${params.peerName}?times_begin=${params.startTime}&times_end=${params.endTime}`);
}