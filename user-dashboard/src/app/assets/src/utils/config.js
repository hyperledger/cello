/*
 SPDX-License-Identifier: Apache-2.0
*/
const format = require("string-format");

const urlBase = window.webRoot;
format.extend(String.prototype);

export default {
  url: {
    chain: {
      list: `${urlBase}api/chain`,
      query: `${urlBase}api/chain/{id}`,
      release: `${urlBase}api/chain/{id}`,
      apply: `${urlBase}api/chain`,
      downloadNetworkConfig: `${urlBase}api/chain/network-config/{id}`,
    },
    smartContract: {
      list: `${urlBase}api/smart-contract`,
      upload: `${urlBase}upload-smart-contract`,
      codeOperate: `${urlBase}api/smart-contract/code/{id}`,
      operate: `${urlBase}api/smart-contract/{id}`,
      codeDeploy: `${urlBase}api/smart-contract/deploy-code/{id}`,
    },
    deploy: {
      list: `${urlBase}api/deploy`,
      query: `${urlBase}api/deploy/{id}`,
      operate: `${urlBase}api/deploy/operate/{id}`,
    },
  },
};
