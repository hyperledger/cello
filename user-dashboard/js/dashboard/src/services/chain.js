/*
 SPDX-License-Identifier: Apache-2.0
*/
import request from '../utils/request'
import config from '../utils/config'
import { stringify } from 'qs';

const { api } = config
const { chain } = api

export async function applyChain(params) {
  return request(chain.apply.format({apikey: window.apikey}), {
    method: "POST",
    body: params
  })
}

export async function listChain(params) {
  return request(`${chain.list.format({apikey: window.apikey})}?${stringify(params)}`)
}

export async function listDBChain(params) {
  return request(`${chain.dbList.format({apikey: window.apikey})}?${stringify(params)}`)
}

export async function releaseChain(params) {
  return request(chain.release.format({apikey: window.apikey, id: params.id}), {
    method: "POST",
    body: params
  })
}

export async function editChain(params) {
  return request(chain.edit.format({apikey: window.apikey, id: params.id}), {
    method: "POST",
    body: params
  })
}
