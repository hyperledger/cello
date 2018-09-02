/*
 SPDX-License-Identifier: Apache-2.0
*/
import { stringify } from 'qs';
import request from '../utils/request';
import config from '../utils/config';

const { urls } = config;
export async function queryChains(params) {
  return request(`${urls.cluster.list}?${stringify(params)}`);
}

export async function operateChain(params) {
  return request(`${urls.cluster.operate}?${stringify(params)}`);
}

export async function deleteChain(params) {
  return request(urls.cluster.crud, {
    method: 'DELETE',
    body: JSON.stringify(params),
  })
}

export async function createChain(params) {
  return request(urls.cluster.crud, {
    method: 'POST',
    body: params,
  });
}

export async function getChain(id) {
  return request(`${urls.cluster.crud}/${id}`)
}
