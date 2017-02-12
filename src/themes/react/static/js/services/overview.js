/**
 * Created by yuehaitao on 2017/1/18.
 */
import { request } from '../utils'
import qs from 'qs'
import { config } from '../utils'

export async function queryStat(params) {
    return request(config.urls.queryStat, {
        method: 'get',
        data: params
    })
}
