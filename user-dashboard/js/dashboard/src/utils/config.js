/*
 SPDX-License-Identifier: Apache-2.0
*/
const API = '/api'
const format = require('string-format')
format.extend(String.prototype)

module.exports = {
  name: 'Cello Baas',
  prefix: 'celloBaas',
  footerText: 'Cello Baas © 2017',
  logo: '/static/images/logo.svg',
  iconFontCSS: '/static/js/dist/iconfont.css',
  iconFontJS: '/static/js/dist/iconfont.js',
  CORS: [],
  openPages: ['/login'],
  apiPrefix: '/api/v1',
  API,
  api: {
    chain: {
      apply: `${API}/chain/{apikey}/apply`,
      list: `${API}/chain/{apikey}/list`,
      dbList: `${API}/chain/{apikey}/db-list`,
      release: `${API}/chain/{apikey}/{id}/release`,
      edit: `${API}/chain/{apikey}/{id}/edit`,
      blocks: `${API}/chain/{dbId}/recentBLock`,
      transaction: `${API}/chain/{dbId}/recentTransaction`,
      queryByBlockId: `${API}/chain/{chainId}/queryByBlockId`,
      queryByTransactionId: `${API}/chain/{chainId}/queryByTransactionId`,
      search:`${API}/chain/search`
    },
    fabric: {
      channelHeight: `${API}/fabric/{id}/channelHeight`
    },
    chainCodes: {
      list: `${API}/chain-code`,
      delete: `${API}/chain-code/{chainCodeId}`,
      edit: `${API}/chain-code/{chainCodeId}`,
      install: `${API}/chain-code/install`,
      instantiate: `${API}/chain-code/instantiate`,
      call: `${API}/chain-code/call`
    },
    token: {
      issue: `${API}/token/issue`,
      address: `${API}/token/address`,
      tokens: `${API}/token/tokens`
    },
    account: {
      list: `${API}/account/`,
      assets: `${API}/account/assets/{accountId}`,
      new: `${API}/account/new`,
      transferToken: `${API}/account/transferToken`
    }
  },
}
