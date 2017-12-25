/*
 SPDX-License-Identifier: Apache-2.0
*/
import appLocaleData from 'react-intl/locale-data/zh';
import zhMessages from './zh.json';
import zhCN from 'antd/lib/locale-provider/zh_CN';

window.appLocale = {
  messages: {
    ...zhMessages,
  },
  antd: zhCN,
  locale: 'zh-Hans',
  data: appLocaleData,
};
