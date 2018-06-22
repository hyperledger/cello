/*
 SPDX-License-Identifier: Apache-2.0
*/
import antdEn from "antd/lib/locale-provider/en_US";
import appLocaleData from "react-intl/locale-data/en";
import enMessages from "./en.json";

export default {
  messages: {
    ...enMessages,
  },
  antd: antdEn,
  locale: "en-US",
  data: appLocaleData,
};
