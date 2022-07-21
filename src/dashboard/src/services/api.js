// import { extend } from 'umi-request';
import request from '@/utils/request';

// eslint-disable-next-line import/prefer-default-export
export async function fakeAccountLogin(params) {
  return request('/api/v1/login', {
    method: 'POST',
    data: params,
  });
}

export async function register(params) {
  return request('/api/v1/register', {
    method: 'POST',
    data: params,
  });
}
