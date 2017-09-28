
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
 */
import axios from 'axios'
import Urls from '@/config/Urls'
import qs from 'qs'

function getAllClusters (params) {
  return axios.get(Urls.cluster.list, {params: params})
}

function getHosts () {
  return axios.get(Urls.host.list, {params: {}})
}

export default {
  getClusters (params, cb) {
    axios.all([getAllClusters(params), getHosts()])
      .then(axios.spread(function (cluster, host) {
        cb({
          host: host.data,
          cluster: cluster.data
        })
      }))
  },
  deleteCluster (params, cb) {
    axios.delete(Urls.cluster.delete, {data: params}).then(res => {
      cb(res.data)
    })
  },
  operateCluster (params, cb) {
    axios.post(Urls.cluster.operation, qs.stringify(params)).then(res => {
      cb(res.data)
    })
  },
  createCluster (params, cb) {
    axios.post(Urls.cluster.create, qs.stringify(params)).then(res => {
      cb(res.data)
    })
  }
}
