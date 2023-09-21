// import { stringify } from 'qs';
import request from '@/utils/request';

// eslint-disable-next-line no-unused-vars
export async function listChainCode(params) {
  return request('/api/v1/chaincodes');
}

export async function uploadChainCode(params) {
  return request('/api/v1/chaincodeRepo', {
    method: 'POST',
    body: params,
  });
}

// eslint-disable-next-line no-unused-vars
export async function listNode(params) {
  // TODO: update the api to specify the chaincode name to filter installed/uninstalled nodes
  return request(`/api/v1/nodes`);
}

export async function installChainCode(params) {
  return request(`/api/v1/chaincodes/installation`, {
    method: 'POST',
    data: params,
  });
}
