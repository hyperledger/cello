/*
 SPDX-License-Identifier: Apache-2.0
*/
import { stringify } from 'qs';
import request from '../utils/request';

export async function queryStatus(params) {
  return request(`/api/stat?${stringify(params)}`)
}
