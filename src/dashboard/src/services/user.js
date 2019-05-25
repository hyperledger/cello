/*
 SPDX-License-Identifier: Apache-2.0
*/
import request from '@/utils/request';

export async function query() {
  return request('/api/users');
}

export async function queryCurrent() {
  const token = localStorage.getItem('cello-token');
  return request('/api/token-verify', {
    method: 'POST',
    data: {
      token,
    },
  });
}

export async function createUser(params) {
  return request('/api/users', {
    method: 'POST',
    data: params,
  });
}

export async function deleteUser(id) {
  return request(`/api/users/${id}`, {
    method: 'DELETE',
  });
}
