
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
 */
import user from '@/api/user'

const state = {
  users: [],
  pageNo: 1,
  pageSize: 10,
  totalCount: 1,
  loadingUsers: false,
  modalVisible: false,
  modalType: 'create',
  currentUser: {}
}

const actions = {
  getUsers ({commit}, params) {
    commit('show_loading')
    user.getUsers(params, result => {
      commit('receive_users', result)
    })
  },
  showUserModal ({commit}, {modalType, user}) {
    commit('show_modal', modalType, user)
  },
  hideUserModal ({commit}) {
    commit('hide_modal')
  },
  deleteSingleUser ({dispatch}, params) {
    user.deleteUser(params, result => {
      if (result.status === 'OK') {
        dispatch('getUsers', {})
        dispatch(params.deleteCallback({success: true}))
      } else {
        dispatch(params.deleteCallback({success: false}))
      }
    })
  }
}

const mutations = {
  show_loading (state) {
    state.loadingUsers = true
  },
  hide_loading (state) {
    state.loadingUsers = false
  },
  receive_users (state, result) {
    state.users = result.result
    state.pageNo = result.pageNo
    state.pageSize = result.pageSize
    state.totalCount = result.totalCount
    state.loadingUsers = false
  },
  show_modal (state, modalType, user) {
    state.modalType = modalType
    state.modalVisible = true
    if (user) {
      state.currentUser = user
    }
  },
  hide_modal (state) {
    state.modalVisible = false
  }
}

const getters = {
  isLoadingUsers (state) {
    return state.loadingUsers
  },
  users (state) {
    return state.users
  },
  userPagination (state) {
    return {
      current: state.pageNo,
      pageSize: state.pageSize,
      total: state.totalCount
    }
  },
  userModal (state) {
    return {
      visible: state.modalVisible,
      type: state.modalType
    }
  },
  currentUser (state) {
    return state.currentUser
  }
}

export default {
  state,
  actions,
  mutations,
  getters
}
