import request from '@/utils/request';

// eslint-disable-next-line import/prefer-default-export
export async function fakeAccountLogin(params) {
  return request('/api/auth', {
    method: 'POST',
    data: params,
  });
}
