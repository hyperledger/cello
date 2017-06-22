
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
*/

import 'babel-polyfill'
import dva from 'dva'
import createLoading from 'dva-loading'
import { useRouterHistory } from 'dva/router';
import { createHashHistory } from 'history';

// 1. Initialize
const app = dva({
  ...createLoading(),
  history: useRouterHistory(createHashHistory)({queryKey: false}),
  onError (error) {
    console.error('app onError --', error)
  },
})

// 2. Model
app.model(require('./models/app'))

// 3. Router
app.router(require('./router'))

// 4. Start
app.start('#root')
