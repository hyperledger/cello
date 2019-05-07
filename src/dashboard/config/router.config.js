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
      { path: '/', redirect: '/operator/overview', authority: ['operator', 'administrator'] },
      {
        path: '/operator',
        name: 'operator',
        icon: 'dashboard',
        routes: [
          {
            path: '/operator/overview',
            name: 'overview',
            component: './Operator/Overview',
          },
          {
            path: '/operator/agent',
            name: 'agent',
            component: './Operator/Agent',
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
