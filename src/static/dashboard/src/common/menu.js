/*
 SPDX-License-Identifier: Apache-2.0
*/
import { IntlProvider, defineMessages } from 'react-intl';
import { isUrl, getLocale } from '../utils/utils';

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

const messages = defineMessages({
    menus: {
        guide: {
            id: 'Menu.Guide',
            defaultMessage: '使用向导',
        },
        overview: {
            id: 'Menu.Overview',
            defaultMessage: '系统概况',
        },
        host: {
            id: 'Menu.Host',
            defaultMessage: '主机管理',
        },
        createHost: {
            id: 'Host.Create.Title',
            defaultMessage: '创建主机',
        },
        organizations:{
            id: 'Menu.Organization',
            defaultMessage:'组织管理'
        },
        createOrg: {
            id: 'Org.Create.Title',
            defaultMessage: '新建组织',
        },
        networks:{
            id: 'Menu.Network',
            defaultMessage:'网络管理'
        },
        createNetworks:{
            id: 'Menu.createNetwork',
            defaultMessage:'新建网络'
        },
        userManagement: {
            id: 'Menu.UserManagement',
            defaultMessage: '用户管理',
        },
        logManagement: {
            id: 'Menu.LogManagement',
            defaultMessage: '日志管理',
        },
    },
});

const menuData = [
    {
        name: intl.formatMessage(messages.menus.guide),
        icon: 'arrow-right',
        path: 'guide',
    },
    {
        name: intl.formatMessage(messages.menus.overview),
        icon: 'home',
        path: 'overview',
    },
    {
        name: intl.formatMessage(messages.menus.host),
        icon: 'laptop',
        path: 'host',
        children: [
            {
                name: intl.formatMessage(messages.menus.host),
                path: 'index',
                hideInMenu: true,
                hideInBreadcrumb: true,
            },
            {
                name: intl.formatMessage(messages.menus.host),
                path: 'create',
                hideInMenu: true,
                hideInBreadcrumb: true,
            },
        ],
    },
    {
        name: intl.formatMessage(messages.menus.organizations),
        icon: 'team',
        path: 'organizations',
        children: [
            {
                name: intl.formatMessage(messages.menus.organizations),
                path: 'orglist',
                hideInMenu: true,
                hideInBreadcrumb: true,
            },
            {
                name: intl.formatMessage(messages.menus.organizations),
                path: 'addorg',
                hideInMenu: true,
                hideInBreadcrumb: true,
            },
        ],
    },
    {
        name: intl.formatMessage(messages.menus.networks),
        icon: 'cluster',
        path: 'blockchain_network',
        children: [
            {
                name: intl.formatMessage(messages.menus.networks),
                path: 'networklist',
                hideInMenu: true,
                hideInBreadcrumb: true,
            },
            {
                name: intl.formatMessage(messages.menus.networks),
                path: 'addnetwork',
                hideInMenu: true,
                hideInBreadcrumb: true,
            },
            {
                name: intl.formatMessage(messages.menus.networks),
                path: 'networkdetail',
                hideInMenu: true,
                hideInBreadcrumb: true,
            },
        ],
    },
    {
        name: intl.formatMessage(messages.menus.userManagement),
        icon: 'user',
        path: 'user-management',
    },
    {
        name: intl.formatMessage(messages.menus.logManagement),
        icon: 'ordered-list',
        path: 'log-management',
    },
];

function formatter(data, parentPath = '/', parentAuthority) {
    return data.map(item => {
        let { path } = item;
        if (!isUrl(path)) {
            path = parentPath + item.path;
        }
        const result = {
            ...item,
            path,
            authority: item.authority || parentAuthority,
        };
        if (item.children) {
            result.children = formatter(item.children, `${parentPath}${item.path}/`, item.authority);
        }
        return result;
    });
}

export const getMenuData = () => formatter(menuData);
