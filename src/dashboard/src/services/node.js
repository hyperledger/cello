import { stringify } from 'qs';
import request from '@/utils/request';

export async function listNode(params) {
  return request(`/api/nodes?${stringify(params)}`);
}

export async function getNode(params) {
  return request(`/api/nodes/${stringify(params)}`);
}

export async function listUserForNode(params) {
  return request(`/api/nodes/${stringify(params)}/users`);
}

export async function registerUserToNode(params) {
  return request(`/api/nodes/${params.id}/users`, {
    method: 'POST',
    data: params.message,
  });
}

export async function deleteNode(params) {
  return request(`/api/nodes/${params}`, {
    method: 'DELETE',
  });
}

export async function operateNode(params) {
  return request(`/api/nodes/${params.id}/operations?action=${params.message}`, {
    method: 'POST',
  });
}
