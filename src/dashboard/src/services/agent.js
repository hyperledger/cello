import { stringify } from 'qs';
import request from '@/utils/request';

export async function listAgent(params) {
  return request(`/api/agents?${stringify(params)}`);
}

export async function getAgent(params) {
  return request(`/api/agents/${params.id}`);
}

export async function createAgent(params) {
  return request('/api/agents', {
    method: 'POST',
    data: params,
  });
}

export async function applyAgent(params) {
  return request('/api/agents/organization', {
    method: 'POST',
    data: params,
  });
}

export async function updateAgent(params) {
  return request(`/api/agents/${params.id}`, {
    method: params.requestMethod,
    data: params.data,
  });
}

export async function deleteAgent(params) {
  return request(`/api/agents/${params}`, {
    method: 'DELETE',
  });
}

export async function releaseAgent(params) {
  return request(`/api/agents/${params}/organization`, {
    method: 'DELETE',
  });
}
