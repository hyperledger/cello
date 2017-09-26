
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
 */
import axios from 'axios'
import Urls from '@/config/Urls'
import qs from 'qs'

export default {
  getHosts (params, cb) {
    axios.get(Urls.host.list, {params: params}).then(res => {
      cb(res.data)
    })
  },
  deleteHost (params, cb) {
    axios.delete(Urls.host.delete, {data: params}).then(res => {
      cb(res.data)
    })
  },
  operateHost (params, cb) {
    axios.post(Urls.host.operation, qs.stringify(params)).then(res => {
      cb(res.data)
    })
  },
  updateHost (params, cb) {
    axios.put(Urls.host.update, qs.stringify(params)).then(res => {
      cb(res.data)
    })
  },
  createHost (params, cb) {
    axios.post(Urls.host.create, qs.stringify(params)).then(res => {
      cb(res.data)
    })
  }
}
