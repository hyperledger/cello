/*
 SPDX-License-Identifier: Apache-2.0
*/
import { queryNotices } from '../services/api';
import { routerRedux } from 'dva/router'
import io from 'socket.io-client';
import {message} from 'antd'
import { FormattedMessage, IntlProvider, defineMessages } from 'react-intl';
const appLocale = window.appLocale;
const intlProvider = new IntlProvider({ locale: appLocale.locale, messages: appLocale.messages }, {});
const { intl } = intlProvider.getChildContext();

const messages = defineMessages({
  success: {
    newTransaction: {
      id: "Global.message.success.newTransaction",
      defaultMessage: "收到新的交易 {name}"
    }
  }
})

export default {
  namespace: 'global',

  state: {
    collapsed: false,
  },

  effects: {
  },

  reducers: {
    changeLayoutCollapsed(state, { payload }) {
      return {
        ...state,
        collapsed: payload,
      };
    },
  },

  subscriptions: {
    setup({ history }) {
      // Subscribe history(url) change, trigger `load` action if pathname is `/`
      return history.listen(({ pathname, search }) => {
        if (typeof window.ga !== 'undefined') {
          window.ga('send', 'pageview', pathname + search);
        }
      });
    },
    socketIO({dispatch}) {
      const socket = io();
      socket.emit('join', {id: window.apikey})
      socket.on('update chain', (data) => {
        console.log(data)
        setTimeout(function () {
          dispatch({
            type: 'chain/queryChains'
          })
        }, 1000)
      })
      socket.on('instantiate done', (data) => {
        dispatch({
          type: 'chainCode/instantiateDone',
          payload: data
        })
      })
      socket.on('new transaction', (data) => {
        dispatch({
          type: 'chain/queryChains'
        })
        message.success(intl.formatMessage(messages.success.newTransaction, {name: data.id}))
      })
      socket.on('issue token done', (data) => {
        message.success(`issue token done ${data.address}`)
        dispatch({
          type: 'token/issueTokenDone'
        })
      })
      socket.on('transfer token done', (data) => {
        message.success(`transfer ${data.count} from ${data.from} to ${data.to} successfully`)
        dispatch({
          type: 'account/reloadAsset'
        })
      })
    }
  },
};
