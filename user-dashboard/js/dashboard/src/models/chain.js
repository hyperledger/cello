/*
 SPDX-License-Identifier: Apache-2.0
*/
import {applyChain, listChain, releaseChain, editChain, listDBChain} from '../services/chain'
import {message} from 'antd'
import { routerRedux } from 'dva/router'
import localStorage from 'localStorage'
import { FormattedMessage, IntlProvider, defineMessages } from 'react-intl';
const appLocale = window.appLocale;
const intlProvider = new IntlProvider({ locale: appLocale.locale, messages: appLocale.messages }, {});
const { intl } = intlProvider.getChildContext();

const messages = defineMessages({
  success: {
    applyChain: {
      id: "Chain.message.success.applyChain",
      defaultMessage: "申请链路 {name} 成功."
    },
    releaseChain: {
      id: "Chain.message.success.releaseChain",
      defaultMessage: "释放链路 {name} 成功."
    },
    editChain: {
      id: "Chain.message.success.editChain",
      defaultMessage: "编辑链路成功."
    }
  },
  fail: {
    applyChain: {
      id: "Chain.message.fail.applyChain",
      defaultMessage: "申请链路 {name} 失败."
    },
    releaseChain: {
      id: "Chain.message.fail.releaseChain",
      defaultMessage: "释放链路 {name} 失败."
    },
    editChain: {
      id: "Chain.message.fail.editChain",
      defaultMessage: "编辑链路失败."
    }
  }
})

export default {
  namespace: 'chain',

  state: {
    chains: [],
    dbChains: [],
    chainLimit: 1,
    loadingDBChains: false,
    currentChainId: "",
    currentChain: null,
    modalVisible: false,
    applying: false,
    releasing: false,
    editing: false,
    editModalVisible: false,
  },

  effects: {
    * queryChains ({payload}, {call, put}) {
      const data = yield call(listChain)
      if (data && data.success) {
        yield put({type: 'setChains', payload: {chains: data.chains, chainLimit: data.limit}})
      } else {
        message.error("Query chains failed!")
        yield put({type: 'setChains', payload: {chains: []}})
      }
    },
    * listDBChain ({payload}, {call, put}) {
      yield put({type: 'showLoadingDBChains'})
      const data = yield call(listDBChain)
      if (data && data.success) {
        yield put({type: 'setDBChains', payload: {dbChains: data.chains}})
      }
    },
    * applyChain({payload}, {call, put}) {
      yield put({type: 'setApplying', payload: {applying: true}})
      const data = yield call(applyChain, payload)
      if (data && data.success) {
        yield put({type: 'setApplying', payload: {applying: false}})
        yield put({type: 'hideModal'})
        message.success(intl.formatMessage(messages.success.applyChain, {name: payload.name}))
        localStorage.setItem(`${window.apikey}-chainId`, data.dbId)
        yield put(routerRedux.push({
          pathname: '/chain'
        }))
      } else {
        yield put({type: 'setApplying', payload: {applying: false}})
        message.error(intl.formatMessage(messages.fail.applyChain, {name: payload.name}))
      }
    },
    *releaseChain({payload}, {call, put}) {
      yield put({type: 'setReleasing', payload: {releasing: true}})
      const data = yield call(releaseChain, payload)
      if (data && data.success) {
        localStorage.removeItem(`${window.apikey}-chainId`)
        message.success(intl.formatMessage(messages.success.releaseChain, {name: payload.name}))
        yield put({
          type: 'queryChains'
        })
      } else {
        message.error(intl.formatMessage(messages.fail.releaseChain, {name: payload.name}))
      }
      yield put({type: 'setReleasing', payload: {releasing: false}})
    },
    *editChain({payload}, {call, put}) {
      yield put({type: 'setEditing', payload: {editing: true}})
      const data = yield call(editChain, payload)
      if (data && data.success) {
        yield put({type: 'updateCurrentChainName', payload: {name: payload.name}})
        yield put({type: 'hideEditModal'})
        message.success(intl.formatMessage(messages.success.editChain))
      } else {
        message.error(intl.formatMessage(messages.fail.editChain))
      }
      yield put({type: 'setEditing', payload: {editing: false}})
    },
  },

  reducers: {
    showEditModal (state) {
      return {...state, editModalVisible: true}
    },
    hideEditModal (state) {
      return {...state, editModalVisible: false}
    },
    changeChainType (state, {payload: {chainType}}) {
      return {...state, chainType, selectedConfig: null, selectedConfigId: 0}
    },
    setSelectedConfig (state, {payload: {selectedConfig, selectedConfigId}}) {
      return {...state, selectedConfig, selectedConfigId}
    },
    setChains (state, {payload: {chains, chainLimit}}) {
      const currentChainId = localStorage.getItem(`${window.apikey}-chainId`)
      let currentChain = null;
      if (!currentChainId && chains.length) {
        localStorage.setItem(`${window.apikey}-chainId`, chains[0].dbId)
        currentChain = chains[0]
      } else {
        chains.forEach(function (chain, index, _ary) {
          if (currentChainId === chain.dbId) {
            currentChain = chain
            return false
          } else {
            return true
          }
        })
      }
      return {...state, chains, currentChain, loadingChains: false, chainLimit, currentChainId}
    },
    setApplying (state, {payload: {applying}}) {
      return {...state, applying}
    },
    setEditing (state, {payload: {editing}}) {
      return {...state, editing}
    },
    setReleasing (state, {payload: {releasing}}) {
      let {currentChain} = state;
      if (currentChain) {
        currentChain.releasing = releasing
        currentChain.status = "releasing"
      }
      return {...state, currentChain}
    },
    updateCurrentChainName (state, {payload: {name}}) {
      let {currentChain} = state;
      currentChain.name = name
      return {...state, currentChain}
    },
    showLoadingDBChains(state) {
      return {...state, loadingDBChains: true}
    },
    setDBChains(state, {payload: {dbChains}}) {
      return {...state, dbChains, loadingDBChains: false}
    },
    changeChainId(state, {payload: {currentChainId}}) {
      let {chains, currentChain} = state;
      localStorage.setItem(`${window.apikey}-chainId`, currentChainId)
      chains.forEach(function (chain, index, _ary) {
        if (currentChainId === chain.dbId) {
          currentChain = chain
          return false
        } else {
          return true
        }
      })
      return {...state, currentChainId, currentChain}
    }
  },

  subscriptions: {
    setup({ history }) {
    },
  },
};
