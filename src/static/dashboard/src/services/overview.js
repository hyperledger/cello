/*
 SPDX-License-Identifier: Apache-2.0
*/
import { stringify } from 'qs';
import request from '../utils/request';
import config from '../utils/config';

const { urls } = config;
export async function queryStatus(params) {
  return request(`${urls.status}?${stringify(params)}`);
}
