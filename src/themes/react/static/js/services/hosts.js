/**
 * Created by yuehaitao on 2017/1/18.
 */
import { request } from '../utils'
import { config } from '../utils'

export async function getHosts(params) {
    return request(config.urls.hosts, {
        method: 'get',
        data: params
    })
}
