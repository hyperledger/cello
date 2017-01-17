import React from 'react'
import {Router} from 'dva/router'
import App from './routes/app'

export default function ({history, app}) {
  const routes = [
    {
      path: '/',
      component: App,
      getIndexRoute (nextState, cb) {
        require.ensure([], require => {
          cb(null, {component: require('./routes/overview')})
        })
      },
      childRoutes: [
        {
          path: 'overview',
          name: 'overview',
          getComponent (nextState, cb) {
            require.ensure([], require => {
              cb(null, require('./routes/overview'))
            })
          }
        }, {
          path: 'hosts',
          name: 'hosts',
          getComponent (nextState, cb) {
            require.ensure([], require => {
              cb(null, require('./routes/hosts'))
            })
          }
        }, {
          path: 'chains/active',
          name: 'chains/active',
          getComponent (nextState, cb) {
            require.ensure([], require => {
              cb(null, require('./routes/chains/active'))
            })
          }
        }, {
          path: 'chains/inused',
          name: 'chains/inused',
          getComponent (nextState, cb) {
            require.ensure([], require => {
              cb(null, require('./routes/chains/inused'))
            })
          }
        }, {
          path: 'release',
          name: 'release',
          getComponent (nextState, cb) {
            require.ensure([], require => {
              cb(null, require("./routes/release"))
            })
          }
        }, {
          path: 'about',
          name: 'about',
          getComponent (nextState, cb) {
            require.ensure([], require => {
              cb(null, require("./routes/about"))
            })
          }
        }, {
          path: '*',
          name: 'error',
          getComponent (nextState, cb) {
            require.ensure([], require => {
              cb(null, require('./routes/error'))
            })
          }
        }
      ]
    }
  ]

  return <Router history={history} routes={routes} />
}
