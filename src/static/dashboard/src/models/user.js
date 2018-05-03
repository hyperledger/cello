/*
 SPDX-License-Identifier: Apache-2.0
*/
import { message } from 'antd';
import { IntlProvider, defineMessages } from 'react-intl';
import {
  query as queryUsers,
  queryCurrent,
  createUser,
  deleteUser,
  updateUser,
} from '../services/user';
import { getLocale } from '../utils/utils';

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
  { locale: currentLocale.locale, messages: currentLocale.messages },
  {}
);
const { intl } = intlProvider.getChildContext();

const messages = defineMessages({
  operate: {
    success: {
      create: {
        id: 'UserManagement.Messages.Operate.Success.Create',
        defaultMessage: '创建用户 {name} 成功',
      },
      edit: {
        id: 'UserManagement.Messages.Operate.Success.Update',
        defaultMessage: '更新用户 {name} 成功',
      },
      delete: {
        id: 'UserManagement.Messages.Operate.Success.Delete',
        defaultMessage: '删除用户 {name} 成功',
      },
    },
  },
});

export default {
  namespace: 'user',

  state: {
    users: [],
    total: 0,
    pageNo: 1,
    pageSize: 10,
    currentUser: {},
  },

  effects: {
    *fetch(_, { call, put }) {
      const response = yield call(queryUsers);
      const { pageNo, pageSize, totalCount, result } = response.users;
      yield put({
        type: 'save',
        payload: {
          pageNo,
          pageSize,
          total: totalCount,
          users: result,
        },
      });
    },
    *fetchCurrent(_, { call, put }) {
      const response = yield call(queryCurrent);
      yield put({
        type: 'saveCurrentUser',
        payload: response,
      });
    },
    *createUser({ payload }, { call, put }) {
      const response = yield call(createUser, payload);
      if (response.status === 'OK') {
        const values = { name: payload.username };
        message.success(intl.formatMessage(messages.operate.success.create, values));
      }
      yield call(payload.callback);
      yield put({
        type: 'fetch',
      });
    },
    *deleteUser({ payload }, { call, put }) {
      const response = yield call(deleteUser, payload.id);
      const jsonResponse = JSON.parse(response);
      if (jsonResponse.status === 'OK') {
        const values = { name: payload.name };
        message.success(intl.formatMessage(messages.operate.success.delete, values));
      }
      yield put({
        type: 'fetch',
      });
    },
    *updateUser({ payload }, { call, put }) {
      const response = yield call(updateUser, payload);
      if (response.status === 'OK') {
        const values = { name: payload.username };
        message.success(intl.formatMessage(messages.operate.success.edit, values));
      }
      yield call(payload.callback);
      yield put({
        type: 'fetch',
      });
    },
  },

  reducers: {
    save(state, action) {
      const { users, pageNo, pageSize, total } = action.payload;
      return {
        ...state,
        users,
        pageNo,
        pageSize,
        total,
      };
    },
    saveCurrentUser(state, action) {
      return {
        ...state,
        currentUser: action.payload,
      };
    },
    changeNotifyCount(state, action) {
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          notifyCount: action.payload,
        },
      };
    },
  },
};
