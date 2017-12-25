/*
 SPDX-License-Identifier: Apache-2.0
*/
import request from '../utils/request'
import config from '../utils/config'
import { stringify } from 'qs';

const { api } = config
const { chainCodes } = api

export async function listChainCodes(params) {
  return request(`${chainCodes.list}?${stringify(params)}`)
}

export async function deleteChainCode(params) {
  return request(chainCodes.delete.format({chainCodeId: params.id}), {
    method: "DELETE"
  })
}

export async function editChainCode(params) {
  return request(chainCodes.edit.format({chainCodeId: params.id}), {
    method: "PUT",
    body: params
  })
}

export async function installChainCode(params) {
  return request(chainCodes.install, {
    method: "POST",
    body: params
  })
}

export async function instantiateChainCode(params) {
  return request(chainCodes.instantiate, {
    method: "POST",
    body: params
  })
}

export async function callChainCode (params) {
  return request(chainCodes.call, {
    method: "POST",
    body: params
  })
}
