/*
 SPDX-License-Identifier: Apache-2.0
*/
import { query as queryUsers, queryCurrent, createUser, deleteUser } from '@/services/user';

export default {
  namespace: 'user',

  state: {
    list: [],
    users: [],
    pagination: {
      total: 0,
      current: 1,
      pageSize: 10,
    },
    currentUser: {},
  },

  effects: {
    *fetch({ payload, callback }, { call, put, select }) {
      const response = yield call(queryUsers, payload);
      const pagination = yield select(state => state.user.pagination);
      const pageSize = payload ? payload.per_page || pagination.pageSize : pagination.pageSize;
      const current = payload ? payload.page || pagination.current : pagination.current;

      pagination.total = response.total;
      pagination.pageSize = pageSize;
      pagination.current = current;
      yield put({
        type: 'save',
        payload: {
          pagination,
          users: response.data,
        },
      });
      if (callback) {
        callback();
      }
    },
    *fetchCurrent(_, { call, put }) {
      const response = yield call(queryCurrent);
      yield put({
        type: 'saveCurrentUser',
        payload: response.user,
      });
    },
    *createUser({ payload, callback }, { call }) {
      const response = yield call(createUser, payload);
      if (callback) {
        callback({
          ...payload,
          ...response,
        });
      }
    },
    *deleteUser({ payload, callback }, { call }) {
      const response = yield call(deleteUser, payload.id);
      if (callback) {
        callback({
          payload,
          ...response,
        });
      }
    },
  },

  reducers: {
    save(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },
    saveCurrentUser(state, action) {
      return {
        ...state,
        currentUser: action.payload || {},
      };
    },
  },
};
