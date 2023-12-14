// import { stringify } from 'qs';
import request from '@/utils/request';

// eslint-disable-next-line no-unused-vars
export async function listChainCode(params) {
  return request('/api/v1/chaincodes');
}

export async function uploadChainCode(params) {
  return request('/api/v1/chaincodes/package', {
    method: 'POST',
    body: params,
  });
}

export async function installChainCode(params) {
  return request('/api/v1/chaincodes/installation', {
    method: 'POST',
    body: params,
  });
}
