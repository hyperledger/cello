
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
 */
import axios from 'axios'

export default {
  getUsers (params, cb) {
    axios.get('/api/user/list', {params: params}).then(res => {
      cb(res.data.users)
    })
  },
  searchUser (params, cb) {
    axios.get('/api/user/search', {params: params}).then(res => {
      cb(res.data)
    })
  },
  createUser (formData, cb) {
    axios.post('/api/user/create', formData).then(res => {
      cb(res.data)
    })
  },
  updateUser (params, cb) {
    const updateUrl = '/api/user/update/' + params.id
    const formData = params.formData
    axios.put(updateUrl, formData).then(res => {
      cb(res.data)
    })
  },
  deleteUser (params, cb) {
    const deleteUrl = '/api/user/delete/' + params.id
    axios.delete(deleteUrl).then(res => {
      cb(res.data)
    })
  }
}
