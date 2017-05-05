import React, { PropTypes } from 'react'
import { Router } from 'dva/router'
import App from './routes/app'

const cached = {}
const registerModel = (app, model) => {
  if (!cached[model.namespace]) {
    app.model(model)
    cached[model.namespace] = 1
  }
}

const Routers = function ({ history, app }) {
  const routes = [
    {
      path: '/',
      component: App,
      getIndexRoute (nextState, cb) {
        require.ensure([], require => {
          registerModel(app, require('./models/overview'))
          cb(null, { component: require('./routes/overview') })
        }, 'overview')
      },
      childRoutes: [
		  {
			  path: 'overview',
			  name: 'overview',
			  getComponent (nextState, cb) {
				  require.ensure([], require => {
          			registerModel(app, require('./models/overview'))
					cb(null, require('./routes/overview'))
				  }, 'overview')
			  }
		  },
          {
              path: 'hosts',
              name: 'hosts',
              getComponent (nextState, cb) {
                  require.ensure([], require => {
                      registerModel(app, require('./models/host'))
                      cb(null, require('./routes/host'))
                  }, 'hosts')
              }
          },
          {
              path: 'chains/active',
              name: 'chains/active',
              getComponent (nextState, cb) {
                  require.ensure([], require => {
                      registerModel(app, require('./models/cluster'))
                      registerModel(app, require('./models/host'))
                      cb(null, require('./routes/cluster/active'))
                  }, 'chains-active')
              }
          },
        {
          path: '*',
          name: 'error',
          getComponent (nextState, cb) {
            require.ensure([], require => {
              cb(null, require('./routes/error/'))
            }, 'error')
          },
        },
      ],
    },
  ]

  return <Router history={history} routes={routes} />
}

Routers.propTypes = {
  history: PropTypes.object,
  app: PropTypes.object,
}

export default Routers
