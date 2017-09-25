
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
 */
import Vuex from 'vuex'
import Vue from 'vue'
import stats from './stats'
import users from './users'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    stats,
    users
  }
})
