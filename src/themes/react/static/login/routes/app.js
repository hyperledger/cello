import React, { PropTypes } from 'react'
import { connect } from 'dva'
import Login from './login'
import { Spin } from 'antd'
import { classnames } from '../utils'
import styles from './main.less'

function App ({ children, location, dispatch, app, loading }) {
  const { login, loginButtonLoading, logging, loginFail } = app
  const loginProps = {
    logging,
    loginFail,
    loading,
    loginButtonLoading,
    onOk (data) {
      dispatch({ type: 'app/login', payload: data })
    },
  }

  return (
      <div>
        <Login {...loginProps} />
      </div>
  )
}

App.propTypes = {
  children: PropTypes.element.isRequired,
  location: PropTypes.object,
  dispatch: PropTypes.func,
  app: PropTypes.object,
  loading: PropTypes.bool,
}

export default connect(({ app, loading }) => ({ app, loading: loading.models.app }))(App)
