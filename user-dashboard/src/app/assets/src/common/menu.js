/*
 SPDX-License-Identifier: Apache-2.0
*/
import { IntlProvider, defineMessages } from 'react-intl';
import { isUrl, getLocale } from "../utils/utils";
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
        channel: {
            id: 'Menu.Channel',
            defaultMessage: '通道管理',
        },
        chainCode: {
            id: 'Menu.ChainCode',
            defaultMessage: '链码管理',
        },
        user: {
            id: 'Menu.UserManagement',
            defaultMessage: '用户管理',
        },
        log: {
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
    name: intl.formatMessage(messages.menus.channel),
    icon: 'share-alt',
   // icon: 'fork',
    path: 'Channel',
    children: [
        {
            name: intl.formatMessage(messages.menus.channel),
            path: 'ChannelList',
            hideInBreadcrumb: true,

        },
        {
            name: intl.formatMessage(messages.menus.channel),
            path: 'NewChannel',
            hideInBreadcrumb: true,
            hideInMenu: true,
        },
        {
            name: intl.formatMessage(messages.menus.channel),
            path: 'ChannelDetail',
            hideInBreadcrumb: true,
            hideInMenu: true,
        },
        {
            name: intl.formatMessage(messages.menus.channel),
            path: 'InstantiateForUpgrade',
            hideInBreadcrumb: true,
            hideInMenu: true,
        },
        {
            name: intl.formatMessage(messages.menus.channel),
            path: 'AddPeer',
            hideInBreadcrumb: true,
            hideInMenu: true,
        },
        {
            name: intl.formatMessage(messages.menus.channel),
            path: 'OrgExpand',
            hideInBreadcrumb: true,
            hideInMenu: true,
        },
        {
            name: intl.formatMessage(messages.menus.channel),
            path: 'LeaveChannel',
            hideInBreadcrumb: true,
            hideInMenu: true,
        }
      ],
    },


    {
    name: intl.formatMessage(messages.menus.chainCode),
    icon: 'link',
    path: 'ChainCode',
    children: [
        {
            name: intl.formatMessage(messages.menus.chainCode),
            path: 'ChainCodeList',
            hideInBreadcrumb: true,
        },
        {
            name: intl.formatMessage(messages.menus.chainCode),
            path: 'upLoadChainCode',
            hideInBreadcrumb: true,
            hideInMenu: true,
        },
        {
            name: intl.formatMessage(messages.menus.chainCode),
            path: 'ChainCodeDetail',
            hideInBreadcrumb: true,
            hideInMenu: true,
        },
        {
            name: intl.formatMessage(messages.menus.chainCode),
            path: 'InstallChainCode',
            hideInBreadcrumb: true,
            hideInMenu: true,
        },
        /*  {
              name: '链码仓库',
              path: 'ChainCodeLab',
                hideInBreadcrumb: true,
                      hideInMenu: true,
        },  */
      ],
    },
    {
        name: intl.formatMessage(messages.menus.user),
        icon: 'user',
        path: 'OrgUser-management',
        children: [
            {
                name: intl.formatMessage(messages.menus.user),
                path: 'OrgUserList',
                hideInBreadcrumb: true,

            },
            {
                name: intl.formatMessage(messages.menus.user),
                path: 'NewOrgUser',
                hideInBreadcrumb: true,
                hideInMenu: true,
            },
            {
                name: intl.formatMessage(messages.menus.user),
                path: 'UserDetail',
                hideInBreadcrumb: true,
                hideInMenu: true,
            },
        ],
    },
    {
        name: intl.formatMessage(messages.menus.log),
        icon: 'ordered-list',
        path: 'log-management',
    },

];

function formatter(data, parentPath = "/", parentAuthority) {
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
      result.children = formatter(
        item.children,
        `${parentPath}${item.path}/`,
        item.authority
      );
    }
    return result;
  });
}

export const getMenuData = () => formatter(menuData);
