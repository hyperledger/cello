/*
 SPDX-License-Identifier: Apache-2.0
*/
import { queryDeploys, queryDeploy, operateDeploy } from "../services/deploy";

export default {
  namespace: "deploy",

  state: {
    deploys: [],
    currentDeploy: {},
    total: 0,
    instantiatedCount: 0,
    instantiatingCount: 0,
    errorCount: 0,
  },

  effects: {
    *fetch({ payload }, { call, put }) {
      const response = yield call(queryDeploys, payload);
      const {
        data,
        total,
        instantiatedCount,
        instantiatingCount,
        errorCount,
      } = response.data;
      yield put({
        type: "setDeploys",
        payload: {
          deploys: data,
          total,
          instantiatingCount,
          instantiatedCount,
          errorCount,
        },
      });
    },
    *queryDeploy({ payload }, { call, put }) {
      const response = yield call(queryDeploy, payload.id);
      const { deploy } = response;
      yield put({
        type: "setDeploy",
        payload: {
          currentDeploy: deploy,
        },
      });
    },
    *operateDeploy({ payload }, { call }) {
      const response = yield call(operateDeploy, payload);
      if (payload.callback) {
        yield call(payload.callback, {
          request: payload,
          response,
        });
      }
    },
  },

  reducers: {
    setDeploys(state, action) {
      const {
        deploys,
        total,
        instantiatedCount,
        instantiatingCount,
        errorCount,
      } = action.payload;
      return {
        ...state,
        deploys,
        total,
        instantiatedCount,
        instantiatingCount,
        errorCount,
      };
    },
    setDeploy(state, action) {
      const { currentDeploy } = action.payload;
      return {
        ...state,
        currentDeploy,
      };
    },
  },
};
