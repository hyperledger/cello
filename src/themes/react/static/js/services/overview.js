/**
 * Created by yuehaitao on 2017/1/18.
 */
import { request, config } from '../utils'
import qs from 'qs'

export async function queryStat(params) {
    console.log(config.urls.overview.stat)
    return request({
        url: config.urls.overview.stat,
        method: 'get',
        data: params,
    })
}
