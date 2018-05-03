/*
 SPDX-License-Identifier: Apache-2.0
*/
import request from '../utils/request';

export async function query(code) {
  return request(`/api/${code}`);
}
