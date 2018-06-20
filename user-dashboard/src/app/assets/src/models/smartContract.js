/*
 SPDX-License-Identifier: Apache-2.0
*/
import { querySmartContracts, deleteSmartContractCode, updateSmartContractCode, deleteSmartContract } from '../services/smart_contract';

export default {
  namespace: 'smartContract',

  state: {
    smartContracts: [],
  },

  effects: {
    *fetch(_, { call, put }) {
      const response = yield call(querySmartContracts);
      yield put({
        type: 'setSmartContracts',
        payload: response.data,
      })
    },
    *deleteSmartContractCode({ payload }, { call }) {
      yield call(deleteSmartContractCode, payload.id);
      if (payload.callback) {
        yield call(payload.callback)
      }
    },
    *updateSmartContractCode({ payload }, { call }) {
      const response = yield call(updateSmartContractCode, payload);
      if (payload.callback) {
        yield call(payload.callback, {
          payload,
          success: response.success,
        });
      }
    },
    *deleteSmartContract({ payload }, { call }) {
      yield call(deleteSmartContract, payload.id);
      if (payload.callback) {
        yield call(payload.callback, payload);
      }
    },
  },

  reducers: {
    setSmartContracts(state, action) {
      return {
        ...state,
        smartContracts: action.payload,
      };
    },
  },
};
