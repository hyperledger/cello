
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
 */
import axios from 'axios'

function getCluster () {
  return axios.get('/api/stat', {params: {res: 'cluster'}})
}

function getHost () {
  return axios.get('/api/stat', {params: {res: 'host'}})
}

export default {
  getStats (cb) {
    axios.all([getCluster(), getHost()])
      .then(axios.spread(function (cluster, host) {
        cb({
          host: host.data,
          cluster: cluster.data
        })
      }))
  }
}
