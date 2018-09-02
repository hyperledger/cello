/*
 SPDX-License-Identifier: Apache-2.0
*/
import { routerRedux } from 'dva/router';
import { IntlProvider, defineMessages } from 'react-intl';
import { message } from 'antd';
import { queryChains, operateChain, deleteChain, createChain, getChain } from '../services/chain';
import { getLocale, sleep } from '../utils/utils';

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
    canQueryChain: false,
  },

  effects: {
    *fetchChains({ payload }, { call, put }) {
      const response = yield call(queryChains, payload);
      const chains = response.data || [];
      yield put({
        type: 'setChains',
        payload: chains,
      });
      yield *chains.map((chain) => {
        if (['creating', 'deleting'].indexOf(chain.status) >= 0 || ['', 'FAIL'].indexOf(chain.health) >= 0) {
          return put({
            type: 'getChain',
            payload: {
              id: chain.id,
            },
          })
        } else {
          return true;
        }
      })
    },
    *getChain({ payload }, { select, call, put}) {
      const response = yield call(getChain, payload.id);
      const canQueryChain = yield select(state => state.chain.canQueryChain);
      if (response.code === 200) {
        yield put({
          type: 'updateChain',
          payload: {
            id: payload.id,
            data: response.data,
          },
        });
        const chain = response.data;
        if (canQueryChain && (['creating', 'deleting'].indexOf(chain.status) >= 0 || ['', 'FAIL'].indexOf(chain.health) >= 0)) {
          yield sleep(5000);
          yield put({
            type: 'getChain',
            payload: {
              id: chain.id,
            },
          })
        }
      } else if (response.code === 404) {
        yield put({
          type: 'removeChain',
          payload: {
            id: payload.id,
          },
        })
      }
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
    updateChain(state, action) {
      const { id, data } = action.payload;
      const { chains } = state;
      chains.forEach((chain, index) => {
        if (chain.id === id) {
          chains[index] = data;
          return false;
        }
      });
      return {
        ...state,
        chains,
      }
    },
    removeChain(state, action) {
      const { id } = action.payload;
      const { chains } = state;
      chains.forEach((chain, index) => {
        if (chain.id === id) {
          chains.splice(index, 1);
          return false;
        }
      });
      return {
        ...state,
        chains,
      }
    },
    setCanQuery(state, action) {
      const { canQueryChain } = action.payload;
      return {
        ...state,
        canQueryChain,
      }
    },
  },
};
