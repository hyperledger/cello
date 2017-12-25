/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent, createElement } from 'react';
import PropTypes from 'prop-types';
import { Breadcrumb, Tabs } from 'antd';
import classNames from 'classnames';
import styles from './index.less';
import { injectIntl, intlShape, defineMessages, FormattedMessage} from 'react-intl';

const messages = defineMessages({
  home: {
    id: "Home",
    defaultMessage: "Home"
  },
  menu: {
    Chain: {
      id: "Menu.Chain",
      defaultMessage: "Chain"
    },
    ChainNew: {
      id: "Path.ChainNew",
      defaultMessage: "New Chain"
    },
    SmartContract: {
      id: "Menu.SmartContract",
      defaultMessage: "Smart Contract"
    },
    API: {
      id: "Menu.API",
      defaultMessage: "API"
    },
    Token: {
      id: "Menu.Token",
      defaultMessage: "Token"
    },
    Account: {
      id: "Menu.Account",
      defaultMessage: "Account"
    },
    Asset: {
      id: "Menu.Asset",
      defaultMessage: "Asset"
    },
    Log: {
      id: "Menu.Log",
      defaultMessage: "Log"
    },
    SmartContractStore: {
      id: "Menu.SmartContractStore",
      defaultMessage: "Smart Contract Store"
    },
  },
})

const { TabPane } = Tabs;

function getBreadcrumbNameWithParams(breadcrumbNameMap, url) {
  let name = '';
  Object.keys(breadcrumbNameMap).forEach((item) => {
    const itemRegExpStr = `^${item.replace(/:[\w-]+/g, '[\\w-]+')}$`;
    const itemRegExp = new RegExp(itemRegExpStr);
    if (itemRegExp.test(url)) {
      // name = breadcrumbNameMap[item];
      name = <FormattedMessage {...messages.menu[breadcrumbNameMap[item]]} />
    }
  });
  return name;
}

class PageHeader extends PureComponent {
  static contextTypes = {
    routes: PropTypes.array,
    params: PropTypes.object,
    location: PropTypes.object,
    breadcrumbNameMap: PropTypes.object,
  };
  onChange = (key) => {
    if (this.props.onTabChange) {
      this.props.onTabChange(key);
    }
  };
  getBreadcrumbProps = () => {
    return {
      routes: this.props.routes || this.context.routes,
      params: this.props.params || this.context.params,
      location: this.props.location || this.context.location,
      breadcrumbNameMap: this.props.breadcrumbNameMap || this.context.breadcrumbNameMap,
    };
  };
  itemRender = (route, params, routes, paths) => {
    const { linkElement = 'a' } = this.props;
    const last = routes.indexOf(route) === routes.length - 1;
    return (last || !route.component)
      ? <span>{route.breadcrumbName}</span>
      : createElement(linkElement, {
        href: paths.join('/') || '/',
        to: paths.join('/') || '/',
      }, route.breadcrumbName);
  }
  render() {
    const { routes, params, location, breadcrumbNameMap } = this.getBreadcrumbProps();
    const {
      title, logo, action, content, extraContent, intl,
      breadcrumbList, tabList, className, linkElement = 'a',
    } = this.props;
    const clsString = classNames(styles.pageHeader, className);
    let breadcrumb;
    if (routes && params) {
      breadcrumb = (
        <Breadcrumb
          className={styles.breadcrumb}
          routes={routes.filter(route => route.breadcrumbName)}
          params={params}
          itemRender={this.itemRender}
        />
      );
    } else if (location && location.pathname) {
      const pathSnippets = location.pathname.split('/').filter(i => i);
      const extraBreadcrumbItems = pathSnippets.map((_, index) => {
        const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
        return (
          <Breadcrumb.Item key={url}>
            {createElement(
              index === pathSnippets.length - 1 ? 'span' : linkElement,
              { [linkElement === 'a' ? 'href' : 'to']: url },
              intl.formatMessage(messages.menu[breadcrumbNameMap[url] ||
              breadcrumbNameMap[url.replace('/', '')] ||
              getBreadcrumbNameWithParams(breadcrumbNameMap, url) ||
              url])
            )}
          </Breadcrumb.Item>
        );
      });
      const breadcrumbItems = [(
        <Breadcrumb.Item key="home">
          {createElement(linkElement, {
            [linkElement === 'a' ? 'href' : 'to']: '/',
          }, intl.formatMessage(messages.home))}
        </Breadcrumb.Item>
      )].concat(extraBreadcrumbItems);
      breadcrumb = (
        <Breadcrumb className={styles.breadcrumb}>
          {breadcrumbItems}
        </Breadcrumb>
      );
    } else if (breadcrumbList && breadcrumbList.length) {
      breadcrumb = (
        <Breadcrumb className={styles.breadcrumb}>
          {
            breadcrumbList.map(item => (
              <Breadcrumb.Item key={item.title}>
                {item.href ? (
                  createElement(linkElement, {
                    [linkElement === 'a' ? 'href' : 'to']: item.href,
                  }, '首页')
                ) : item.title}
              </Breadcrumb.Item>)
            )
          }
        </Breadcrumb>
      );
    } else {
      breadcrumb = null;
    }

    const tabDefaultValue = tabList && (tabList.filter(item => item.default)[0] || tabList[0]);

    return (
      <div className={clsString}>
        {breadcrumb}
        <div className={styles.detail}>
          {logo && <div className={styles.logo}>{logo}</div>}
          <div className={styles.main}>
            <div className={styles.row}>
              {title && <h1 className={styles.title}>{title}</h1>}
              {action && <div className={styles.action}>{action}</div>}
            </div>
            <div className={styles.row}>
              {content && <div className={styles.content}>{content}</div>}
              {extraContent && <div className={styles.extraContent}>{extraContent}</div>}
            </div>
          </div>
        </div>
        {
          tabList &&
          tabList.length &&
          <Tabs
            className={styles.tabs}
            defaultActiveKey={(tabDefaultValue && tabDefaultValue.key)}
            onChange={this.onChange}
          >
            {
              tabList.map(item => <TabPane tab={item.tab} key={item.key} />)
            }
          </Tabs>
        }
      </div>
    );
  }
}

export default injectIntl(PageHeader)
