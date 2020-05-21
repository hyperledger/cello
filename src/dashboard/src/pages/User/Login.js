/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { Component } from 'react';
import { connect, injectIntl } from 'umi';
import { Checkbox, Alert } from 'antd';
import Login from '@/components/Login';
import styles from './Login.less';

const { UserName, Password, Submit } = Login;

@connect(({ login, loading }) => ({
  login,
  submitting: loading.effects['login/login'],
}))
class LoginPage extends Component {
  state = {
    type: 'account',
    autoLogin: true,
  };

  handleSubmit = (err, values) => {
    const { type } = this.state;
    if (!err) {
      const { dispatch } = this.props;
      dispatch({
        type: 'login/login',
        payload: {
          ...values,
          type,
        },
      });
    }
  };

  changeAutoLogin = e => {
    this.setState({
      autoLogin: e.target.checked,
    });
  };

  renderMessage = content => (
    <Alert
      className={styles.alertText}
      style={{ marginBottom: 24 }}
      message={content}
      type="error"
      showIcon
    />
  );

  render() {
    const { login, submitting, intl } = this.props;
    const { type, autoLogin } = this.state;
    return (
      <div className={styles.main}>
        <Login
          defaultActiveKey={type}
          onSubmit={this.handleSubmit}
          ref={form => {
            this.loginForm = form;
          }}
        >
          {login.status === 'error' &&
            login.type === 'account' &&
            !submitting &&
            this.renderMessage(intl.formatMessage({ id: 'app.login.message-invalid-credentials' }))}
          <UserName
            name="username"
            placeholder={`${intl.formatMessage({ id: 'app.login.userName' })}: admin or user`}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: 'validation.userName.required' }),
              },
            ]}
          />
          <Password
            name="password"
            placeholder={`${intl.formatMessage({ id: 'app.login.password' })}: passw0rd`}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: 'validation.password.required' }),
              },
            ]}
            onPressEnter={e => {
              e.preventDefault();
              this.loginForm.validateFields(this.handleSubmit);
            }}
          />
          <div>
            <Checkbox checked={autoLogin} onChange={this.changeAutoLogin}>
              {intl.formatMessage({
                id: 'app.login.remember-me'
              })}
            </Checkbox>
          </div>
          <Submit loading={submitting}>
            {intl.formatMessage({
              id: 'app.login.login'
            })}
          </Submit>
        </Login>
      </div>
    );
  }
}

export default injectIntl(LoginPage);
