
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
 */
import Vue from 'vue'
import Router from 'vue-router'
const HostPage = resolve => {
  require.ensure([], () => {
    resolve(require('@/pages/HostPage.vue'))
  })
}
const HomePage = resolve => {
  require.ensure([], () => {
    resolve(require('@/pages/HomePage.vue'))
  })
}
const ChainsPage = resolve => {
  require.ensure([], () => {
    resolve(require('@/pages/ChainsPage.vue'))
  })
}
const UserManagementPage = resolve => {
  require.ensure([], () => {
    resolve(require('@/pages/UserManagement/index.vue'))
  })
}

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'overview',
      component: HomePage
    },
    {
      path: '/hosts',
      name: 'hosts',
      component: HostPage
    },
    {
      path: '/chains',
      name: 'chains',
      component: ChainsPage
    },
    {
      path: '/user_management',
      name: 'userManagement',
      component: UserManagementPage
    }
  ]
})
