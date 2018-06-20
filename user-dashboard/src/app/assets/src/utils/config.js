/*
 SPDX-License-Identifier: Apache-2.0
*/
const format = require('string-format');

const urlBase = window.webRoot;
format.extend(String.prototype);

export default {
  url: {
    chain: {
      list: `${urlBase}api/chain`,
      release: `${urlBase}api/chain/{id}`,
      apply: `${urlBase}api/chain`,
      downloadNetworkConfig: `${urlBase}api/chain/network-config/{id}`,
    },
    smartContract: {
      list: `${urlBase}api/smart-contract`,
      upload: `${urlBase}upload-smart-contract`,
      codeOperate: `${urlBase}api/smart-contract/code/{id}`,
      operate: `${urlBase}api/smart-contract/{id}`,
    },
  },
};
