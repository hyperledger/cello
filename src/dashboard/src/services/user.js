import request from '@/utils/request';

export async function query() {
  return request('/api/users');
}

export async function queryCurrent() {
  const token = localStorage.getItem('cello-token');
  return request('/api/token-verify', {
    method: 'POST',
    data: {
      token,
    },
  });
}
