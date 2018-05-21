/*
 SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { routerRedux, Route, Switch } from 'dva/router';
import { addLocaleData, IntlProvider } from 'react-intl';
import { LocaleProvider, Spin } from 'antd';
import dynamic from 'dva/dynamic';
import { getRouterData } from './common/router';
import Authorized from './utils/Authorized';
import { getLocale } from './utils/utils';
import styles from './index.less';

const { ConnectedRouter } = routerRedux;
const { AuthorizedRoute } = Authorized;
dynamic.setDefaultLoadingComponent(() => {
  return <Spin size="large" className={styles.globalSpin} />;
});

const currentLocale = getLocale();
addLocaleData(currentLocale.data);

function RouterConfig({ history, app }) {
  const routerData = getRouterData(app);
  const UserLayout = routerData['/user'].component;
  const BasicLayout = routerData['/'].component;
  return (
    <IntlProvider locale={currentLocale.locale} messages={currentLocale.messages}>
      <LocaleProvider locale={currentLocale.antd}>
        <ConnectedRouter history={history}>
          <Switch>
            <Route path="/user" component={UserLayout} />
            <AuthorizedRoute
              path="/"
              render={props => <BasicLayout {...props} />}
              authority={['admin', 'user', 'operator']}
              redirectPath="/user/login"
            />
          </Switch>
        </ConnectedRouter>
      </LocaleProvider>
    </IntlProvider>
  );
}

export default RouterConfig;
