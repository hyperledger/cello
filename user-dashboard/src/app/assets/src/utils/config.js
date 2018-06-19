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
  },
};
