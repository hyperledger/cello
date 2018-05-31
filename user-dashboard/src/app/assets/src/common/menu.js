/*
 SPDX-License-Identifier: Apache-2.0
*/
import { isUrl } from '../utils/utils';

const menuData = [
  {
    name: 'Chain',
    icon: 'link',
    path: 'chain',
  },
    {
    name: 'Apply Chain',
    path: 'apply-chain',
    hideInMenu: true,
    hideInBreadcrumb: false,
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
