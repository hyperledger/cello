
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
 */
import status from '@/api/status'

const state = {
  hostStatus: [],
  hostType: [],
  clusterStatus: [],
  clusterType: [],
  loadingStats: false
}

const actions = {
  getStats ({commit}) {
    commit('show_loading')
    status.getStats(stats => {
      commit('receive_stats', stats)
    })
  }
}

const mutations = {
  show_loading (state) {
    state.loadingStats = true
  },
  hide_loading (state) {
    state.loadingStats = false
  },
  receive_stats (state, stats) {
    state.hostStatus = stats.host.status
    state.hostType = stats.host.type
    state.clusterStatus = stats.cluster.status
    state.clusterType = stats.cluster.type
    state.loadingStats = false
  }
}

const getters = {
  isLoadingStats (state) {
    return state.loadingStats
  },
  hostStatus (state) {
    return state.hostStatus
  },
  hostType (state) {
    return state.hostType
  },
  clusterStatus (state) {
    return state.clusterStatus
  },
  clusterType (state) {
    return state.clusterType
  }
}

export default {
  state,
  actions,
  mutations,
  getters
}
