
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
 */
import host from '@/api/host'
import {Message} from 'iview'

const state = {
  hosts: [],
  pageNo: 1,
  pageSize: 10,
  totalCount: 1,
  loadingHosts: false,
  modalVisible: false,
  modalType: 'create',
  currentHost: {}
}

const actions = {
  getHosts ({commit}, params) {
    commit('show_loading')
    host.getHosts(params, result => {
      commit('receive_hosts', result)
    })
  },
  operateHost ({dispatch}, params) {
    host.operateHost(params, result => {
      dispatch('getHosts')
    })
  },
  updateHost ({dispatch}, params) {
    host.updateHost(params, result => {
      if (result.status === 'OK') {
        Message.success('Update host ' + params.name + ' success')
      } else {
        Message.error('Update host ' + params.name + ' failed')
      }
      dispatch('getHosts')
    })
  },
  createHost ({dispatch}, params) {
    host.createHost(params, result => {
      if (result.status === 'OK') {
        Message.success('Create host ' + params.name + ' success')
      } else {
        Message.error('Create host ' + params.name + ' failed')
      }
      dispatch('getHosts')
    })
  },
  deleteHost ({dispatch}, params) {
    host.deleteHost(params, result => {
      console.log(result)
      dispatch('getHosts')
    })
  }
}

const mutations = {
  show_loading (state) {
    state.loadingHosts = true
  },
  hide_loading (state) {
    state.loadingHosts = false
  },
  receive_hosts (state, result) {
    state.loadingHosts = false
    state.hosts = result.data
  }
}

const getters = {
  isLoadingHosts (state) {
    return state.loadingHosts
  },
  hosts (state) {
    return state.hosts
  },
  hostPagination (state) {
    return {
      current: state.pageNo,
      pageSize: state.pageSize,
      total: state.totalCount
    }
  }
}

export default {
  state,
  actions,
  mutations,
  getters
}
