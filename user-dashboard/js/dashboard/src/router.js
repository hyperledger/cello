/*
 SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Router, Route, Switch, Redirect } from 'dva/router';
import { LocaleProvider } from 'antd';
import BasicLayout from './layouts/BasicLayout';
import { addLocaleData, IntlProvider } from 'react-intl';

const appLocale = window.appLocale;
addLocaleData(appLocale.data);

function RouterConfig({ history }) {
  return (
    <LocaleProvider locale={appLocale.antd}>
      <IntlProvider locale={appLocale.locale} messages={appLocale.messages}>
      <Router history={history}>
        <Switch>
          <Route path="/" component={BasicLayout} />
          <Redirect to="/" />
        </Switch>
      </Router>
      </IntlProvider>
    </LocaleProvider>
  );
}

export default RouterConfig;
