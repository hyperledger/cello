/*
 SPDX-License-Identifier: Apache-2.0
*/
export default [
  // user
  {
    path: '/user',
    component: '../layouts/UserLayout',
    routes: [
      { path: '/user', redirect: '/user/login' },
      { path: '/user/login', name: 'login', component: './User/Login' },
      {
        component: '404',
      },
    ],
  },
  // app
  {
    path: '/',
    component: '../layouts/BasicLayout',
    Routes: ['src/pages/Authorized'],
    routes: [
      { path: '/', redirect: '/overview', authority: ['operator', 'administrator', 'user'] },
      {
        path: '/overview',
        name: 'overview',
        icon: 'eye',
        component: './Overview/Overview',
      },
      {
        path: '/operator',
        name: 'operator',
        icon: 'dashboard',
        authority: ['operator', 'administrator'],
        routes: [
          {
            path: '/operator/overview',
            name: 'overview',
            component: './Operator/Overview',
          },
          {
            path: '/operator/organization',
            authority: ['operator'],
            name: 'organization',
            component: './Operator/Organization',
          },
          {
            path: '/operator/agent',
            name: 'agent',
            component: './Operator/Agent/Agent',
          },
          {
            path: '/operator/agent/newAgent',
            name: 'newAgent',
            component: './Operator/Agent/newAgent',
            hideInMenu: true,
          },
          {
            path: '/operator/agent/editAgent',
            name: 'editAgent',
            component: './Operator/Agent/newAgent',
            hideInMenu: true,
          },
          {
            path: '/operator/node',
            name: 'node',
            component: './Operator/Node/Node',
          },
          {
            path: '/operator/node/new',
            name: 'newNode',
            hideInMenu: true,
            component: './Operator/Node/New/index',
            routes: [
              {
                path: '/operator/node/new',
                redirect: '/operator/node/new/basic-info',
              },
              {
                path: '/operator/node/new/basic-info',
                name: 'basicInfo',
                component: './Operator/Node/New/basicInfo',
              },
              {
                path: '/operator/node/new/node-info',
                name: 'nodeInfo',
                component: './Operator/Node/New/nodeInfo',
              },
            ],
          },
          {
            path: '/operator/userManagement',
            name: 'userManagement',
            component: './Operator/UserManagement',
          },
        ],
      },
      {
        component: '404',
      },
    ],
  },
];
