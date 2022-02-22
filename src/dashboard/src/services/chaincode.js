import { stringify } from 'qs';
import request from '@/utils/request';

export async function listChainCode(params) {
  return request('/api/v1/chaincodes');
}
