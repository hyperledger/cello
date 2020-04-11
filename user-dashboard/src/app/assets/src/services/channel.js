/*
 SPDX-License-Identifier: Apache-2.0
*/
import { stringify } from 'qs';
import request from '../utils/request';
import config from '../utils/config';

const { urls } = config;
export async function query() {
    return request(urls.channel.list);
}

export async function queryCurrent() {
    return request('/api/currentUser');
}

export async function createChannel(params) {
    return request(urls.channel.create, {
        method: 'POST',
        body: params,
    });
}

export async function deleteChannel(id) {
    return request(`${urls.channel.delete}/${id}`, {
        method: 'DELETE',
    });
}

export async function searchChannel(params) {
    return request(`${urls.channel.search}?${stringify(params)}`);
}

export async function updateChannel(params) {
    return request(`${urls.channel.update}/${params.id}`, {
        method: 'PUT',
        body: params,
    });
}
