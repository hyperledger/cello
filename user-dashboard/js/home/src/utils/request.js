/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
 */

import axios from 'axios'
import qs from 'qs'

const fetch = (options) => {
    const {
        method = 'get',
        data,
        url,
    } = options
    switch (method.toLowerCase()) {
        case 'get':
            return axios.get(`${url}${options.data ? `?${qs.stringify(options.data)}` : ''}`)
        case 'delete':
            return axios.delete(url, { data })
        case 'head':
            return axios.head(url, data)
        case 'post':
            return axios.post(url, qs.stringify(data))
        case 'put':
            return axios.put(url, qs.stringify(data))
        case 'patch':
            return axios.patch(url, data)
        default:
            return axios(options)
    }
}

export default function request (options) {
    return fetch(options).then((response) => {
        const { statusText, status } = response
        let data = options.isCross ? response.data.query.results.json : response.data
        return {
            code: 0,
            status,
            message: statusText,
            ...data,
        }
    }).catch((error) => {
        const { response = { statusText: 'Network Error' } } = error
        return { code: 1, message: response.statusText }
    })
}
