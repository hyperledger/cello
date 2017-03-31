/**
 * Created by yuehaitao on 2017/1/18.
 */
import { request, config } from '../utils'

export async function getHosts(params) {
    return request({
        url: config.urls.hosts,
        method: 'get',
        data: params
    })
}
