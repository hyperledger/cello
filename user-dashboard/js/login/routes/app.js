import React, { PropTypes } from 'react'
import { connect } from 'dva'
import Login from './login'
import Register from './register'
import { Spin } from 'antd'

class App extends React.Component {
  constructor(props) {
      super(props)
      this.state = {
          formType: 'login'
      }
  }
  render() {
      const { dispatch, app, loading } = this.props
      const { login, loginButtonLoading, logging, loginFail, registering, registerFail } = app
      const {formType} = this.state
      const _that = this
      const loginProps = {
          logging,
          loginFail,
          loading,
          loginButtonLoading,
          onOk (data) {
              dispatch({ type: 'app/login', payload: data })
          },
          onClickSignUp () {
              _that.setState({
                  formType: 'register'
              })
          }
      }
      const registerProps = {
          registering,
          registerFail,
          loading,
          loginButtonLoading,
          onOk (data) {
              console.log("register user ", data)
              dispatch({ type: 'app/register', payload: data })
          },
          onClickSignIn () {
              _that.setState({
                  formType: 'login'
              })
          }
      }
      return (
          <div>
              {formType === 'login' &&
              <Login {...loginProps} />
              }
              {formType === 'register' &&
              <Register {...registerProps} />
              }
          </div>
      )
  }
}

App.propTypes = {
  children: PropTypes.element.isRequired,
  location: PropTypes.object,
  dispatch: PropTypes.func,
  app: PropTypes.object,
  loading: PropTypes.bool,
}

export default connect(({ app, loading }) => ({ app, loading: loading.models.app }))(App)
