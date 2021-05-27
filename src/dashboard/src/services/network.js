import { stringify } from 'qs';
import request from '@/utils/request';

export async function listNetwork(params) {
  return request(`/api/networks?${stringify(params)}`);
}

export async function createNetwork(params) {
  return request('/api/networks', {
    method: 'POST',
    data: params,
  });
}

export async function deleteNetwork(id) {
  return request(`/api/networks/${id}`, {
    method: 'DELETE',
  });
}
