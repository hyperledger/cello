/*
 SPDX-License-Identifier: Apache-2.0
*/
import request from '../utils/request'
import config from '../utils/config'
import { stringify } from 'qs';

const { api } = config
const { fabric } = api

export async function queryChannelHeight(params) {
  return request(`${fabric.channelHeight.format({id: params.id})}?${stringify(params)}`)
}
