import request from '@/utils/request';

export default async function queryError(code) {
  return request(`/api/v1/${code}`);
}
