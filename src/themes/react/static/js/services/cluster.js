/**
 * Created by yuehaitao on 2017/4/4.
 */
import {request, config} from '../utils'

export async function list(params) {
	return request({
		url: config.urls.cluster.list,
		method: 'get',
		data: params
	})
}

export async function create(params) {
	return request({
		url: config.urls.cluster.create,
		method: 'post',
		data: params
	})
}

export async function deleteCluster(params) {
	return request({
		url: config.urls.cluster.delete,
		method: 'delete',
		data: params
	})
}

export async function operation(params) {
	return request({
		url: config.urls.cluster.operation,
		method: 'post',
		data: params
	})
}
