/*
 SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { addLocaleData, IntlProvider } from 'react-intl';
import { routerRedux, Route, Switch } from 'dva/router';
import { LocaleProvider, Spin } from 'antd';
import dynamic from 'dva/dynamic';
import { getRouterData } from './common/router';
import styles from './index.less';
import { getLocale } from './utils/utils';

const { ConnectedRouter } = routerRedux;
dynamic.setDefaultLoadingComponent(() => {
  return <Spin size="large" className={styles.globalSpin} />;
});

const currentLocale = getLocale();
addLocaleData(currentLocale.data);
function RouterConfig({ history, app }) {
  const routerData = getRouterData(app);
  const BasicLayout = routerData['/'].component;
  return (
    <IntlProvider locale={currentLocale.locale} messages={currentLocale.messages}>
      <LocaleProvider locale={currentLocale.antd}>
        <ConnectedRouter history={history}>
          <Switch>
            <Route path="/" render={props => <BasicLayout {...props} />} />
          </Switch>
        </ConnectedRouter>
      </LocaleProvider>
    </IntlProvider>
  );
}

export default RouterConfig;
