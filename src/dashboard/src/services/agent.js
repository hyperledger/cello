import { stringify } from 'qs';
import request from '@/utils/request';

export async function listAgent(params) {
  return request(`/api/v1/agents?${stringify(params)}`);
}

export async function getAgent(params) {
  return request(`/api/v1/agents/${params.id}`);
}

export async function createAgent(params) {
  return request('/api/v1/agents', {
    method: 'POST',
    data: params,
  });
}

export async function applyAgent(params) {
  return request('/api/v1/agents/organization', {
    method: 'POST',
    data: params,
  });
}

export async function updateAgent(params) {
  return request(`/api/v1/agents/${params.id}`, {
    method: params.requestMethod,
    data: params.data,
  });
}

export async function deleteAgent(params) {
  return request(`/api/v1/agents/${params}`, {
    method: 'DELETE',
  });
}

export async function releaseAgent(params) {
  return request(`/api/v1/agents/${params}/organization`, {
    method: 'DELETE',
  });
}
