/*
 SPDX-License-Identifier: Apache-2.0
*/
import { routerRedux } from 'dva/router';
import { IntlProvider, defineMessages } from 'react-intl';
import { message } from 'antd';
import { queryHosts, createHost, deleteHost, operateHost, updateHost } from '../services/host';
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
      fillup: {
        id: 'Host.Messages.Operate.Success.FillUp',
        defaultMessage: '填充主机 {name} 成功。',
      },
      clean: {
        id: 'Host.Messages.Operate.Success.Clean',
        defaultMessage: '清空主机 {name} 成功。',
      },
      reset: {
        id: 'Host.Messages.Operate.Success.Reset',
        defaultMessage: '重置主机 {name} 成功。',
      },
      update: {
        id: 'Host.Messages.Operate.Success.Update',
        defaultMessage: '更新主机成功。',
      },
    },
  },
});

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
    *operateHost({ payload }, { call, put }) {
      const response = yield call(operateHost, payload);
      yield put({
        type: 'fetchHosts',
      });
      if (response.code === 200) {
        const values = { name: payload.name };
        message.success(intl.formatMessage(messages.operate.success[payload.action], values));
      }
    },
    *updateHost({ payload }, { call, put }) {
      const response = yield call(updateHost, payload);
      if (response.code === 200) {
        message.success(intl.formatMessage(messages.operate.success.update));
        yield put(
          routerRedux.push({
            pathname: '/host',
          })
        );
      }
      yield call(payload.callback);
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
