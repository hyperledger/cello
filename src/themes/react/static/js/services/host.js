/**
 * Created by yuehaitao on 2017/1/18.
 */
import { request, config } from '../utils'

export async function getHosts(params) {
    return request({
        url: config.urls.host.list,
        method: 'get',
        data: params
    })
}

export async function createHost(params) {
	return request({
		url: config.urls.host.create,
		method: 'post',
		data: params
	})
}

export async function deleteHost(params) {
	return request({
		url: config.urls.host.delete,
		method: 'delete',
		data: params
	})
}

export async function updateHost(params) {
	return request({
		url: config.urls.host.update,
		method: 'put',
		data: params
	})
}
