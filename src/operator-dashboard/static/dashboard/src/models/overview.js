/*
 SPDX-License-Identifier: Apache-2.0
*/
import { queryStatus } from '../services/overview';

export default {
  namespace: 'overview',

  state: {
    clusterStatus: [],
    clusterTypes: [],
    hostStatus: [],
    hostTypes: [],
  },

  effects: {
    *fetchClusterStatus(_, { call, put }) {
      const response = yield call(queryStatus, { res: 'cluster' });
      yield put({
        type: 'setClusterStatus',
        payload: response,
      });
    },
    *fetchHostStatus(_, { call, put }) {
      const response = yield call(queryStatus, { res: 'host' });
      yield put({
        type: 'setHostStatus',
        payload: response,
      });
    },
  },

  reducers: {
    setClusterStatus(state, action) {
      const { status, type } = action.payload;
      const statusData = status.map(item => {
        return {
          x: item.name,
          y: item.y,
        };
      });
      const typeData = type.map(item => {
        return {
          x: item.name,
          y: item.y,
        };
      });
      return {
        ...state,
        clusterStatus: statusData,
        clusterTypes: typeData,
      };
    },
    setHostStatus(state, action) {
      const { status, type } = action.payload;
      const statusData = status.map(item => {
        return {
          x: item.name,
          y: item.y,
        };
      });
      const typeData = type.map(item => {
        return {
          x: item.name,
          y: item.y,
        };
      });
      return {
        ...state,
        hostStatus: statusData,
        hostTypes: typeData,
      };
    },
  },
};
