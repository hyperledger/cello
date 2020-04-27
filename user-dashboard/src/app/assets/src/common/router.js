/*
 SPDX-License-Identifier: Apache-2.0
*/
import { createElement } from "react";
import dynamic from "dva/dynamic";
import pathToRegexp from "path-to-regexp";
import { getMenuData } from "./menu";

let routerDataCache;

const modelNotExisted = (app, model) =>
    // eslint-disable-next-line
    !app._models.some(({ namespace }) => {
        return namespace === model.substring(model.lastIndexOf("/") + 1);
    });

// wrapper of dynamic
const dynamicWrapper = (app, models, component) => {
    // () => require('module')
    // transformed by babel-plugin-dynamic-import-node-sync
    if (component.toString().indexOf(".then(") < 0) {
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
            models
                .filter(model => modelNotExisted(app, model))
                .map(m => import(`../models/${m}.js`)),
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
        "/": {
            component: dynamicWrapper(app, ["user", "login", "OrgUserList"], () =>
                import("../layouts/BasicLayout")
            ),
        },
        '/guide': {
            component: dynamicWrapper(app, [], () => import('../routes/Guide/guide')),
        },
        '/overview': {
            component: dynamicWrapper(app, ['overview'], () => import('../routes/Overview')),
        },
        '/Channel/ChannelList': {
            component: dynamicWrapper(app, ['ChannelList',], () => import('../routes/Channel/ChannelList')),
        },
        '/Channel/NewChannel': {
            component: dynamicWrapper(app, ['ChannelList','organization','networklist',], () => import('../routes/Channel/NewChannel')),
        },
        '/Channel/ChannelDetail': {
            component: dynamicWrapper(app, ["ChannelInstant","InstantChainCode","ChannelList","ChannelDetail","smartContract",], () => import('../routes/ChannelDetail/ChannelDetail')),
        },
        '/ChannelDetail/orglist': {
            component: dynamicWrapper(app, ["organization", ], () => import('../routes/ChannelDetail/orglist')),
        },
        '/ChannelDetail/instantList': {
            component: dynamicWrapper(app, ["ChannelInstant",'InstantChainCode',"chain"], () => import('../routes/ChannelDetail/instantList')),
        },
        '/Channel/InstantiateForUpgrade': {
            component: dynamicWrapper(app, ["ChannelList","ChainCodeList","ChainCodeDetail","Identities","InstantChainCode"], () => import('../routes/ChannelDetail/InstantiateForUpgrade')),
        },
        '/Channel/OrgExpand': {
            component: dynamicWrapper(app, ["OrgExpand", "chain"], () => import('../routes/Channel/OrgExpand')),
        },
        '/Channel/LeaveChannel': {
            component: dynamicWrapper(app, ["LeaveChannel"], () => import('../routes/Channel/LeaveChannel')),
        },
        '/Channel/NewOrgInvitation': {
            component: dynamicWrapper(app, ['OrgExpand','ChannelList'], () => import('../routes/Channel/NewOrgInvitation')),
        },
        '/Channel/AddPeer': {
            component: dynamicWrapper(app, ['AddPeer'], () => import('../routes/Channel/AddPeer')),
        },
        
        '/ChainCode/ChainCodeList': {
            component: dynamicWrapper(app, ['ChainCodeList','ChannelList','InstantChainCode','Identities'], () => import('../routes/ChainCode/ChainCodeList')),
        },
        '/ChainCode/ChainCodeState': {
            component: dynamicWrapper(app, ['ChainCodeList'], () => import('../routes/ChainCode/ChainCodeState')),
        },
        '/ChainCode/upLoadChainCode': {
            component: dynamicWrapper(app, ['ChainCodeList','smartContract'], () => import('../routes/ChainCode/upLoadChainCode')),
        },
        '/ChainCode/InstallChainCode': {
            component: dynamicWrapper(app, ['ChainCodeList','InstantChainCode',], () => import('../routes/ChainCode/InstallChainCode')),
        },
        '/ChainCode/Instantiate': {
            component: dynamicWrapper(app, ['ChainCodeList','ChannelList','InstantChainCode','Identities'], () => import('../routes/ChainCode/Instantiate')),
        },
        '/ChainCode/ChainCodeDetail': {
            component: dynamicWrapper(app, ['ChainCodeDetail','smartContract'], () => import('../routes/ChainCode/ChainCodeDetail')),
        },
        
        "/OrgUser-management/OrgUserList": {
            component: dynamicWrapper(app, ['OrgUserList'], () => import("../routes/OrgUser-management/OrgUserList")),
        },
        "/OrgUser-management/NewOrgUser": {
            component: dynamicWrapper(app, ['OrgUserList',], () => import("../routes/OrgUser-management/NewOrgUser")),
        },
        "/OrgUser-management/UserDetail": {
            component: dynamicWrapper(app, ['OrgUserList',], () => import("../routes/OrgUser-management/UserDetail")),
        },
        '/log-management': {
            component: dynamicWrapper(app, ['loglist'], () => import('../routes/LogManagement/loglist')),
        },
        '/persenal': {
            component: dynamicWrapper(app, ['OrgUserList'], () => import('../routes/OrgUser-management/PersonalCenter')),
        },
        "/exception/403": {
            component: dynamicWrapper(app, [], () =>
                import("../routes/Exception/403")
            ),
        },
        "/exception/404": {
            component: dynamicWrapper(app, [], () =>
                import("../routes/Exception/404")
            ),
        },
        "/exception/500": {
            component: dynamicWrapper(app, [], () =>
                import("../routes/Exception/500")
            ),
        },
        "/user": {
            component: dynamicWrapper(app, [], () => import("../layouts/UserLayout")),
        },
        "/user/login": {
            component: dynamicWrapper(app, ["login"], () =>
                import("../routes/User/Login")
            ),
        },
        "/smart-contract/index": {
            component: dynamicWrapper(app, ["smartContract"], () =>
                import("../routes/SmartContract")
            ),
        },
        "/smart-contract/info/:id": {
            component: dynamicWrapper(app, ["smartContract", "chain"], () =>
                import("../routes/SmartContract/Info")
            ),
        },
        "/smart-contract/new": {
            component: dynamicWrapper(app, ["smartContract"], () =>
                import("../routes/SmartContract/New")
            ),
        },
        "/smart-contract/new-code/:id": {
            component: dynamicWrapper(app, ["smartContract"], () =>
                import("../routes/SmartContract/New/code")
            ),
        },
        "/smart-contract/running": {
            component: dynamicWrapper(app, ["deploy"], () =>
                import("../routes/SmartContract/Running")
            ),
        },
        "/smart-contract/invoke-query/:id": {
            component: dynamicWrapper(app, ["deploy"], () =>
                import("../routes/SmartContract/InvokeQuery")
            ),
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
        const menuKey = Object.keys(menuData).find(key =>
            pathRegexp.test(`${key}`)
        );
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
