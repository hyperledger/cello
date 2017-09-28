
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
 */
import cluster from '@/api/cluster'
import {Message} from 'iview'

const state = {
  clusters: [],
  pageNo: 1,
  pageSize: 10,
  totalCount: 1,
  loadingClusters: false,
  modalVisible: false,
  modalType: 'create',
  currentCluster: {},
  hostDict: {},
  hosts: [],
  creating: false
}

const actions = {
  getClusters ({commit}, params) {
    commit('show_loading')
    cluster.getClusters(params, result => {
      commit('receive_clusters', result)
    })
  },
  showClusterModal ({commit}) {
    commit('show_modal')
  },
  hideClusterModal ({commit}) {
    commit('hide_modal')
  },
  createCluster ({dispatch, commit}, params) {
    commit('show_creating')
    cluster.createCluster(params, result => {
      if (result.status === 'OK') {
        Message.success('Create Cluster ' + params.name + ' success.')
        dispatch('getClusters')
      } else {
        Message.success('Create Cluster ' + params.name + ' failed.')
      }
      commit('hide_creating')
      commit('hide_modal')
    })
  },
  deleteCluster ({dispatch, commit}, params) {
    commit('update_cluster', {...params, status: 'deleting'})
    cluster.deleteCluster(params, result => {
      if (result.status === 'OK') {
        Message.success('Delete Cluster ' + params.name + ' success.')
      } else {
        Message.success('Delete Cluster ' + params.name + ' failed.')
      }
      dispatch('getClusters')
    })
  },
  operateCluster ({dispatch, commit}, params) {
    commit('update_cluster', {...params, id: params.cluster_id, status: 'operating'})
    cluster.operateCluster(params, result => {
      if (result.status === 'OK') {
        Message.success('Operate cluster ' + params.name + ' success.')
      } else {
        Message.success('Operate cluster ' + params.name + ' failed.')
      }
      dispatch('getClusters')
    })
  }
}

const mutations = {
  show_loading (state) {
    state.loadingClusters = true
  },
  hide_loading (state) {
    state.loadingClusters = false
  },
  show_creating (state) {
    state.creating = true
  },
  hide_creating (state) {
    state.creating = false
  },
  receive_clusters (state, result) {
    let hostDict = {}
    let hosts = []
    state.loadingClusters = false
    state.clusters = result.cluster.data
    result.host.data.map((item, i) => {
      hostDict[item.id] = {
        name: item.name,
        capacity: item.capacity,
        type: item.type
      }
      hosts.push({
        name: item.name,
        id: item.id
      })
    })
    state.hostDict = hostDict
    state.hosts = hosts
  },
  update_cluster (state, params) {
    let clusters = state.clusters
    clusters.every(function (item, index, arry) {
      if (item.id === params.id) {
        clusters[index].status = params.status
        return false
      } else {
        return true
      }
    })
    state.clusters = clusters
  },
  show_modal (state) {
    state.modalVisible = true
  },
  hide_modal (state) {
    state.modalVisible = false
  }
}

const getters = {
  isLoadingClusters (state) {
    return state.loadingClusters
  },
  clusters (state) {
    return state.clusters
  },
  clusterPagination (state) {
    return {
      current: state.pageNo,
      pageSize: state.pageSize,
      total: state.totalCount
    }
  },
  hostDict (state) {
    return state.hostDict
  },
  hostOptions (state) {
    return state.hosts
  },
  clusterModalVisible (state) {
    return state.modalVisible
  },
  creatingCluster (state) {
    return state.creating
  }
}

export default {
  state,
  actions,
  mutations,
  getters
}
