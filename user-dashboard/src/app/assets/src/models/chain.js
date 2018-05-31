/*
 SPDX-License-Identifier: Apache-2.0
*/
import { routerRedux } from 'dva/router';
import { message } from 'antd';
import { queryChains, release, apply } from '../services/chain';

export default {
  namespace: 'chain',

  state: {
    chains: [],
  },

  effects: {
    *fetch(_, { call, put }) {
      const response = yield call(queryChains);
      yield put({
        type: 'setChains',
        payload: response.data,
      })
    },
    *release({ payload }, { call, put }) {
      const response = yield call(release, payload.id);
      if (JSON.parse(response).success) {
        message.success('Release Chain successfully');
        yield put({
          type: 'fetch',
        })
      }
    },
    *apply({ payload }, { call, put }) {
    	const response = yield call(apply, payload);
    	if (response.success) {
        message.success('Apply Chain successfully');
        yield put(
          routerRedux.push({
            pathname: '/chain',
          })
        );
      }
      yield call(payload.callback);
    },
  },

  reducers: {
    setChains(state, action) {
      return {
        ...state,
        chains: action.payload,
      };
    },
  },
};
