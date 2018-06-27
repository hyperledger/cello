/*
 SPDX-License-Identifier: Apache-2.0
*/
import { routerRedux } from "dva/router";
import { message } from "antd";
import { queryChains, release, apply, queryChain } from "../services/chain";

export default {
  namespace: "chain",

  state: {
    chains: [],
    currentChain: {},
    deploys: [],
    height: 0,
    recentBlock: [],
    recentTransaction: [],
    channels: [],
    installedChainCodes: [],
    instantiatedChainCodes: [],
    operations: [],
  },

  effects: {
    *fetch(_, { call, put }) {
      const response = yield call(queryChains);
      yield put({
        type: "setChains",
        payload: response.data,
      });
    },
    *release({ payload }, { call, put }) {
      const response = yield call(release, payload.id);
      if (JSON.parse(response).success) {
        message.success("Release Chain successfully");
        yield put({
          type: "fetch",
        });
      }
    },
    *apply({ payload }, { call, put }) {
      const response = yield call(apply, payload);
      if (response.success) {
        message.success("Apply Chain successfully");
        yield put(
          routerRedux.push({
            pathname: "/chain",
          })
        );
      }
      yield call(payload.callback);
    },
    *queryChain({ payload }, { call, put }) {
      const response = yield call(queryChain, payload);
      yield put({
        type: "setCurrentChain",
        payload: {
          currentChain: response.chain,
          height: response.height,
          recentBlock: response.recentBlock,
          recentTransaction: response.recentTransaction,
          deploys: response.deploys,
          channels: response.channels,
          installedChainCodes: response.installedChainCodes,
          instantiatedChainCodes: response.instantiatedChainCodes,
          operations: response.operations,
        },
      });
    },
  },

  reducers: {
    setChains(state, action) {
      return {
        ...state,
        chains: action.payload,
      };
    },
    setCurrentChain(state, action) {
      const {
        currentChain,
        height,
        recentBlock,
        recentTransaction,
        deploys,
        channels,
        installedChainCodes,
        instantiatedChainCodes,
        operations,
      } = action.payload;
      return {
        ...state,
        currentChain,
        height,
        recentTransaction,
        recentBlock,
        deploys,
        channels,
        instantiatedChainCodes,
        installedChainCodes,
        operations,
      };
    },
    clearCurrentChain(state) {
      return {
        ...state,
        currentChain: {},
        height: 0,
        recentTransaction: [],
        recentBlock: [],
        deploys: [],
        channels: [],
        instantiatedChainCodes: [],
        installedChainCodes: [],
        operations: [],
      };
    },
  },
};
