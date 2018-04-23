/*
 SPDX-License-Identifier: Apache-2.0
*/
import { stringify } from 'qs';
import request from '../utils/request';
import config from '../utils/config';

const { urls } = config;
export async function queryHosts(params) {
  return request(`${urls.host.list}?${stringify(params)}`);
}

export async function createHost(params) {
  return request(urls.host.crud, {
    method: 'POST',
    body: params,
  });
}

export async function deleteHost(params) {
  return request(urls.host.crud, {
    method: 'DELETE',
    body: JSON.stringify(params),
  });
}
