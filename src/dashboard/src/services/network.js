import { stringify } from 'qs';
import request from '@/utils/request';

export async function listNetwork(params) {
  return request(`/api/v1/networks?${stringify(params)}`);
}

export async function createNetwork(params) {
  return request('/api/v1/networks', {
    method: 'POST',
    data: params,
  });
}

export async function deleteNetwork(id) {
  return request(`/api/v1/networks/${id}`, {
    method: 'DELETE',
  });
}
