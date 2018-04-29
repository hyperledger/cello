/*
 SPDX-License-Identifier: Apache-2.0
*/
import { routerRedux } from 'dva/router';
import { IntlProvider, defineMessages } from 'react-intl';
import { message } from 'antd';
import { queryChains, operateChain, deleteChain, createChain } from '../services/chain';
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
      restart: {
        id: 'Chain.Messages.Operate.Success.Restart',
        defaultMessage: '重启链 {name} 成功。',
      },
      start: {
        id: 'Chain.Messages.Operate.Success.Start',
        defaultMessage: '启动链 {name} 成功。',
      },
      stop: {
        id: 'Chain.Messages.Operate.Success.Stop',
        defaultMessage: '停止链 {name} 成功。',
      },
      release: {
        id: 'Chain.Messages.Operate.Success.Release',
        defaultMessage: '释放链成功。',
      },
    },
  },
});

export default {
  namespace: 'chain',

  state: {
    chains: [],
  },

  effects: {
    *fetchChains({ payload }, { call, put }) {
      const response = yield call(queryChains, payload);
      yield put({
        type: 'setChains',
        payload: response.data,
      });
    },
    *operateChain({ payload }, { call, put }) {
      const response = yield call(operateChain, payload);
      yield put({
        type: 'fetchChains',
      });
      if (response.code === 200) {
        const values = { name: payload.name };
        message.success(intl.formatMessage(messages.operate.success[payload.action], values));
      }
    },
    *deleteChain({ payload }, { call, put }) {
      const response = yield call(deleteChain, payload);
      if (response.code === 200) {
        message.success(`Delete Chain ${payload.name} successfully`);
      }
      yield put({
        type: 'fetchChains',
      });
    },
    *createChain({ payload }, { call, put }) {
      const response = yield call(createChain, payload);
      if (response.code === 201) {
        message.success('Create Chain successfully');
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
