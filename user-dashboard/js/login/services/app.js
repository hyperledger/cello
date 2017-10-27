import { config, request } from '../utils'

export async function login (params) {
    return request({
        url: config.urls.login,
        method: 'post',
        data: params
    })
}

export async function logout (params) {
  return request('/api/logout', {
    method: 'post',
    data: params,
  })
}

export async function register(params) {
	return request({
	    url: config.urls.register,
		method: 'post',
		data: params
	})
}
