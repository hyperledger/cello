/*
 SPDX-License-Identifier: Apache-2.0
*/
import {queryChannelHeight} from '../services/fabric'
import {message} from 'antd'
import { routerRedux } from 'dva/router'

export default {
  namespace: 'fabric',

  state: {
    channelHeight: 0,
    queryingChannelHeight: false
  },

  effects: {
    * queryChannelHeight ({payload}, {select, call, put}) {
      yield put({type: 'setQueryingHeight'})
      const data = yield call(queryChannelHeight, payload)
      if (data && data.success) {
        yield put({
          type: 'setHeight',
          payload: {
            channelHeight: parseInt(data.height)
          }
        })
      }
    },
  },

  reducers: {
    setQueryingHeight (state) {
      return {...state, queryChannelHeight: true}
    },
    setHeight (state, action) {
      return {...state, ...action.payload, queryChannelHeight: false}
    },
  },

  subscriptions: {
    setup({ history }) {
    },
  },
};
