/*
 SPDX-License-Identifier: Apache-2.0
*/
import appLocaleData from "react-intl/locale-data/zh";
import zhCN from "antd/lib/locale-provider/zh_CN";
import zhMessages from "./zh.json";

export default {
  messages: {
    ...zhMessages,
  },
  antd: zhCN,
  locale: "zh-Hans",
  data: appLocaleData,
};
