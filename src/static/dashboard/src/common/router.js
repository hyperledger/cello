/*
 SPDX-License-Identifier: Apache-2.0
*/
import { createElement } from 'react';
import dynamic from 'dva/dynamic';
import pathToRegexp from 'path-to-regexp';
import { getMenuData } from './menu';

let routerDataCache;

const modelNotExisted = (app, model) =>
    // eslint-disable-next-line
    !app._models.some(({ namespace }) => {
        return namespace === model.substring(model.lastIndexOf('/') + 1);
    });

// wrapper of dynamic
const dynamicWrapper = (app, models, component) => {
    // () => require('module')
    // transformed by babel-plugin-dynamic-import-node-sync
    if (component.toString().indexOf('.then(') < 0) {
        models.forEach(model => {
            if (modelNotExisted(app, model)) {
                // eslint-disable-next-line
                app.model(require(`../models/${model}`).default);
            }
        });
        return props => {
            if (!routerDataCache) {
                routerDataCache = getRouterData(app);
            }
            return createElement(component().default, {
                ...props,
                routerData: routerDataCache,
            });
        };
    }
    // () => import('module')
    return dynamic({
        app,
        models: () =>
            models.filter(model => modelNotExisted(app, model)).map(m => import(`../models/${m}.js`)),
        // add routerData prop
        component: () => {
            if (!routerDataCache) {
                routerDataCache = getRouterData(app);
            }
            return component().then(raw => {
                const Component = raw.default || raw;
                return props =>
                    createElement(Component, {
                        ...props,
                        routerData: routerDataCache,
                    });
            });
        },
    });
};

function getFlatMenuData(menus) {
    let keys = {};
    menus.forEach(item => {
        if (item.children) {
            keys[item.path] = { ...item };
            keys = { ...keys, ...getFlatMenuData(item.children) };
        } else {
            keys[item.path] = { ...item };
        }
    });
    return keys;
}

export const getRouterData = app => {
    const routerConfig = {
        '/': {
            component: dynamicWrapper(app, ['user'], () => import('../layouts/BasicLayout')),
        },
        '/guide': {
            component: dynamicWrapper(app, [], () => import('../routes/Guide/guide')),
        },
        '/overview': {
            component: dynamicWrapper(app, ['overview'], () => import('../routes/Overview')),
        },
        '/host/index': {
            component: dynamicWrapper(app, ['host'], () => import('../routes/Host')),
        },
        '/host/create': {
            component: dynamicWrapper(app, ['host'], () => import('../routes/Host/CreateHost')),
        },
        '/user-management': {
            component: dynamicWrapper(app, ['user'], () => import('../routes/UserManagement')),
        },
        '/organizations/orglist': {
            component: dynamicWrapper(app, ['organization'], () => import('../routes/organizations/orglist')),
        },
        '/organizations/addorg': {
            component: dynamicWrapper(app, ['organization','host'], () => import('../routes/organizations/addorg')),
        },
        '/blockchain_network/networklist': {
            component: dynamicWrapper(app, ['networklist'], () => import('../routes/blockchain_network/networklist')),
        },
        '/blockchain_network/addnetwork': {
            component: dynamicWrapper(app, ['networklist', 'host', 'organization'], () => import('../routes/blockchain_network/addnetwork')),
        },
        '/blockchain_network/appendpeerorg': {
            component: dynamicWrapper(app, ['networklist', 'organization'], () => import('../routes/blockchain_network/appendpeerorg')),
        },
        '/blockchain_network/networkdetail': {
            component: dynamicWrapper(app, ['networklist', 'host'], () => import('../routes/blockchain_network/networkdetail')),
        },
        "/user": {
            component: dynamicWrapper(app, [], () => import("../layouts/UserLayout")),
        },
        "/user/login": {
            component: dynamicWrapper(app, ["login"], () =>
                import("../routes/User/Login")
            ),
        },
        '/log-management': {
            component: dynamicWrapper(app, ['loglist'], () => import('../routes/LogManagement/loglist')),
        },
    };
    // Get name from ./menu.js or just set it in the router data.
    const menuData = getFlatMenuData(getMenuData());
    
    // Route configuration data
    // eg. {name,authority ...routerConfig }
    const routerData = {};
    // The route matches the menu
    Object.keys(routerConfig).forEach(path => {
        // Regular match item name
        // eg.  router /user/:id === /user/chen
        const pathRegexp = pathToRegexp(path);
        const menuKey = Object.keys(menuData).find(key => pathRegexp.test(`${key}`));
        let menuItem = {};
        // If menuKey is not empty
        if (menuKey) {
            menuItem = menuData[menuKey];
        }
        let router = routerConfig[path];
        // If you need to configure complex parameter routing,
        // https://github.com/ant-design/ant-design-pro-site/blob/master/docs/router-and-nav.md#%E5%B8%A6%E5%8F%82%E6%95%B0%E7%9A%84%E8%B7%AF%E7%94%B1%E8%8F%9C%E5%8D%95
        // eg . /list/:type/user/info/:id
        router = {
            ...router,
            name: router.name || menuItem.name,
            authority: router.authority || menuItem.authority,
            hideInBreadcrumb: router.hideInBreadcrumb || menuItem.hideInBreadcrumb,
        };
        routerData[path] = router;
    });
    return routerData;
};
