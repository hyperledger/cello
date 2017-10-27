import { request } from '../utils'

export async function getProfile (params) {
    return request({
        url: `/api/profile/${window.apikey}`,
        method: 'get',
        data: params
    })
}

export async function updateProfile(params) {
	return request({
		url: `/api/profile/${window.apikey}/update`,
		method: 'post',
		data: params
	})
}
