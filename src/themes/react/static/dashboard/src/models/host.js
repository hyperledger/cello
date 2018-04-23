/*
 SPDX-License-Identifier: Apache-2.0
*/
import { routerRedux } from 'dva/router';
import { queryHosts, createHost, deleteHost } from '../services/host';

export default {
  namespace: 'host',

  state: {
    hosts: [],
  },

  effects: {
    *fetchHosts({ payload }, { call, put }) {
      const response = yield call(queryHosts, payload);
      yield put({
        type: 'setHosts',
        payload: response.data,
      });
    },
    *createHost({ payload }, { call, put }) {
      const response = yield call(createHost, payload);
      if (response && response.code === 201) {
        yield put(
          routerRedux.push({
            pathname: '/host',
          })
        );
      }
      yield call(payload.callback);
    },
    *deleteHost({ payload }, { call, put }) {
      yield call(deleteHost, payload);
      yield put({
        type: 'fetchHosts',
      });
    },
  },

  reducers: {
    setHosts(state, action) {
      return {
        ...state,
        hosts: action.payload,
      };
    },
  },
};
