/*
 SPDX-License-Identifier: Apache-2.0
*/
import {
  querySmartContracts,
  deleteSmartContractCode,
  updateSmartContractCode,
  deleteSmartContract,
  querySmartContract,
  deploySmartContract,
} from "../services/smart_contract";

export default {
  namespace: "smartContract",

  state: {
    smartContracts: [],
    currentSmartContract: {},
    codes: [],
    deploys: [],
    newOperations: [],
  },

  effects: {
    *fetch(_, { call, put }) {
      const response = yield call(querySmartContracts);
      yield put({
        type: "setSmartContracts",
        payload: response.data,
      });
    },
    *deleteSmartContractCode({ payload }, { call }) {
      yield call(deleteSmartContractCode, payload.id);
      if (payload.callback) {
        yield call(payload.callback);
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
    *querySmartContract({ payload }, { call, put }) {
      const response = yield call(querySmartContract, payload.id);
      if (response.success) {
        yield put({
          type: "setCurrentSmartContract",
          payload: {
            currentSmartContract: response.info,
            codes: response.codes,
            deploys: response.deploys,
            newOperations: response.newOperations,
          },
        });
      }
    },
    *deploySmartContract({ payload }, { call }) {
      const response = yield call(deploySmartContract, payload);
      if (payload.callback) {
        yield call(payload.callback, response);
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
    setCurrentSmartContract(state, action) {
      const {
        currentSmartContract,
        codes,
        newOperations,
        deploys,
      } = action.payload;
      return {
        ...state,
        currentSmartContract,
        codes,
        deploys,
        newOperations,
      };
    },
    updateDeployStatus(state, action) {
      const { deploys } = state;
      const { deployId, status } = action.payload;
      deploys.forEach((deploy, index) => {
        if (deploy._id === deployId) {
          deploy.status = status;
          deploys[index] = deploy;
          return false;
        }
      });
      return {
        ...state,
        deploys,
      };
    },
  },
};
