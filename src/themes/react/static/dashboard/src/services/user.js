/*
 SPDX-License-Identifier: Apache-2.0
*/
import request from '../utils/request';

export async function query() {
  return request('/api/users');
}

export async function queryCurrent() {
  return request('/api/currentUser');
}
