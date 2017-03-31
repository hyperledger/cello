import axios from 'axios'
import qs from 'qs'
import config from './config'

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
      return axios.post(url, data)
    case 'put':
      return axios.put(url, data)
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
