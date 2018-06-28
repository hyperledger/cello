/*
 SPDX-License-Identifier: Apache-2.0
*/
import io from "socket.io-client";
import { message } from "antd";

export default {
  namespace: "global",

  state: {
    collapsed: false,
    notices: [],
  },

  effects: {
    *clearNotices({ payload }, { put, select }) {
      yield put({
        type: "saveClearedNotices",
        payload,
      });
      const count = yield select(state => state.global.notices.length);
      yield put({
        type: "user/changeNotifyCount",
        payload: count,
      });
    },
  },

  reducers: {
    changeLayoutCollapsed(state, { payload }) {
      return {
        ...state,
        collapsed: payload,
      };
    },
    saveNotices(state, { payload }) {
      return {
        ...state,
        notices: payload,
      };
    },
    saveClearedNotices(state, { payload }) {
      return {
        ...state,
        notices: state.notices.filter(item => item.type !== payload),
      };
    },
  },

  subscriptions: {
    setup({ history }) {
      // Subscribe history(url) change, trigger `load` action if pathname is `/`
      return history.listen(({ pathname, search }) => {
        if (typeof window.ga !== "undefined") {
          window.ga("send", "pageview", pathname + search);
        }
      });
    },
    socketIO({ dispatch }) {
      const socket = io("/");
      socket.emit("join", { id: window.id });
      socket.on("instantiate-done", response => {
        const { data: { payload }, meta } = response;
        const { deployId, codeVersion, codeName, chainName } = meta;
        let messageType = "success";
        let resultStatus = "successfully";
        let status = "instantiated";
        if (!payload.success) {
          messageType = "error";
          resultStatus = "failed";
          status = "error";
        }
        message[messageType](
          `Instantiate smart contract ${codeName} ${codeVersion} on chain ${chainName} ${resultStatus}.`
        );
        dispatch({
          type: "smartContract/updateDeployStatus",
          payload: {
            deployId,
            status,
          },
        });
      });
    },
  },
};
