/*
 SPDX-License-Identifier: Apache-2.0
*/
import {applyChain, listChain, releaseChain, editChain, listDBChain, recentBlocks, recentTransactions, recentTokenTransfer, queryByBlockId, queryByTransactionId} from '../services/chain'
import {message} from 'antd'
import { routerRedux } from 'dva/router'
import localStorage from 'localStorage'
import {isEmpty} from '../utils/utils'
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
    },
    queryRecentBlocks:{
      id:"Chain.message.fail.queryRecentBlocks",
      defaultMessage:"Query recentBlocks failed!"
    },
    queryTransaction:{
      id:"Chain.message.fail.queryTransaction",
      defaultMessage:"Query Transaction failed!"
    },
    queryBlock:{
      id:"Chain.message.fail.queryBlock",
      defaultMessage:"Query Block failed!"
    },
    queryRecentTransaction:{
      id:"Chain.message.fail.queryRecentTransaction",
      defaultMessage:"Query recentTransactions failed!"
    },
    tokenTransfer:{
      id:"Chain.message.fail.tokenTransfer",
      defaultMessage:"Query recentTokenTransfer failed!"
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
    currentChain: {},
    modalVisible: false,
    applying: false,
    releasing: false,
    editing: false,
    editModalVisible: false,
    blockInfoModalVisible: false,
    txInfoModalVisible: false,
    recentBlocks: [],
    loadingRecentBlocks: false,
    loadingRecentTransactions: false,
    recentTransactions:[],
    smartChainCodes : [],
    loadingSmartChainCodes: false,
    recentTokenTransfer:[],
    queryByBlockId:[],
    currentBlockTxList: [],
    currentTxInfo: {},
    loadingCurrentBlockTxList: false,
    loadingCurrentTxInfo: false,
    queryBlockVisible:false,
    queryByTransactionId:[],
    queryByTransactionVisible:false,
  },

  effects: {
    * queryChains ({payload}, {call, put}) {
      const data = yield call(listChain)
      if (data && data.success) {
        let currentChainId = localStorage.getItem(`${window.apikey}-chainId`)
        const chains = data.chains
        let currentChain = {};
        let findMatchChainId = false;
        if (!currentChainId && chains.length) {
          localStorage.setItem(`${window.apikey}-chainId`, chains[0].dbId)
          currentChain = chains[0]
        } else {
          chains.forEach(function (chain, index, _ary) {
            if (currentChainId === chain.dbId) {
              currentChain = chain
              findMatchChainId = true
              return false
            } else {
              return true
            }
          })
          if (!findMatchChainId && chains.length) {
            currentChain = chains[0]
            currentChainId = chains[0].dbId
          }
        }
        if (!isEmpty(currentChain)) {
          yield put({
            type: 'recentBlocks',
            payload: {
              blockHeight: currentChain.blocks,
              recentNum : currentChain.blocks >= 6 ? 6 : currentChain.blocks,
              dbId : currentChain.dbId
            }
          })
          yield put({
            type: 'recentTransactions',
            payload: {
              blockHeight: currentChain.blocks,
              recentNum : currentChain.blocks >= 6 ? 6 : currentChain.blocks,
              dbId : currentChain.dbId
            }
          })
          yield put({
            type: 'token/listTokens',
            payload: {
              chainId: currentChain.dbId
            }
          })
          yield put({
            type: 'chainCodes',
            payload: {
              dbId : currentChain.dbId
            }
          })
        }
        yield put({type: 'setChains', payload: {chains: data.chains, chainLimit: data.limit, currentChain, currentChainId}})
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
    * recentBlocks ({payload}, {call, put}) {
      yield put({type: 'showLoadingRecentBlocks'})
      const data = yield call(recentBlocks,payload)
      if (data && data.success) {
        yield put({type: 'setRecentBlocks', payload: {recentBlocks: data.allBlocks}})
      } else {
        message.error(intl.formatMessage(messages.fail.queryRecentBlocks))
      }
    },
    * queryByTransactionId ({payload}, {call, put}) {
      console.log(payload)
      const data = yield call(queryByTransactionId, payload)
      console.log(data)
      if (data && data.success) {
        yield put({type: 'setCurrentTxInfo', payload: {currentTxInfo: data}})
      } else {
        message.error(intl.formatMessage(messages.fail.queryTransaction))
      }
    },
    * queryByBlockId ({payload}, {call, put}) {
      const data = yield call(queryByBlockId,payload)
      yield put({type: 'showLoadingCurrentBlockTxList'})
      if (data && data.success) {
        yield put({type: 'setCurrentBlockTxList', payload: {currentBlockTxList: data.txList}})
      } else {
        message.error(intl.formatMessage(messages.fail.queryBlock))
      }
      yield put({type: 'hideLoadingCurrentBlockTxList'})
    },
    * recentTransactions ({payload}, {call, put}) {
      const data = yield call(recentTransactions,payload)
      if (data && data.success) {
        yield put({type: 'setTransactions', payload: {recentTransactions: data.allTransactions}})
      } else {
        message.error(intl.formatMessage(messages.fail.queryRecentTransaction))
      }
    },
    * recentTokenTransfer ({payload}, {call, put}) {

      const data = yield call(recentTokenTransfer,payload)
      if (data && data.success) {

        yield put({type: 'setTokenTransfer', payload: {recentTokenTransfer: data.records}})
      } else {
        message.error(intl.formatMessage(messages.fail.tokenTransfer))
      }
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
    },

    hideQueryBlock(state){
      state.queryBlockVisible = false
      return {...state, queryBlockVisible: false}
    },
    showQueryBlock (state) {
      state.queryBlockVisible = true
      return {...state, queryBlockVisible: true}
    },
    showQueryTransactionId (state) {
      state.queryByTransactionVisible = true
      return {...state, queryByTransactionVisible: true}
    },
    hideQueryTransactionId(state){
      state.queryByTransactionVisible = false
      return {...state, queryByTransactionVisible: false}
    },
    setqueryByTransactionId (state , {payload : queryByTransactionId}) {
      state.queryByTransactionId = queryByTransactionId

      return {...state,queryByBlockId}
    },
    setqueryByBlockId (state , {payload : queryByBlockId}) {
      state.queryByBlockId = queryByBlockId

      return {...state,queryByBlockId}
    },
    setCurrentBlockTxList (state, {payload: {currentBlockTxList}}) {
      return {...state, currentBlockTxList}
    },
    showLoadingRecentBlocks (state) {
      return {...state, loadingRecentBlocks: true}
    },
    showLoadingRecentTransactions (state) {
      return {...state, loadingRecentTransactions: true}
    },
    setCurrentTxInfo (state, {payload: {currentTxInfo}}) {
      return {...state, currentTxInfo}
    },
    setTokenTransfer (state , {payload : recentTokenTransfer}) {
      state.recentTokenTransfer = recentTokenTransfer

      return {...state,recentTokenTransfer}
    },
    setTransactions (state , {payload : recentTransactions}) {
      state.recentTransactions = recentTransactions
      return {...state,recentTransactions, loadingRecentTransactions: false}
    },
    setRecentBlocks (state , {payload : recentBlocks}) {
      state.recentBlocks = recentBlocks
      return {...state, recentBlocks, loadingRecentBlocks: false}
    },
    showBlockInfoModal(state) {
      return {...state, blockInfoModalVisible: true}
    },
    hideBlockInfoModal(state) {
      return {...state, blockInfoModalVisible: false}
    },
    showTxInfoModal(state) {
      return {...state, txInfoModalVisible: true}
    },
    hideTxInfoModal(state) {
      return {...state, txInfoModalVisible: false}
    },
    changeChainType (state, {payload: {chainType}}) {
      return {...state, chainType, selectedConfig: null, selectedConfigId: 0}
    },
    setSelectedConfig (state, {payload: {selectedConfig, selectedConfigId}}) {
      return {...state, selectedConfig, selectedConfigId}
    },
    setChains (state, {payload: {chains, chainLimit, currentChain, currentChainId}}) {
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
    },
    showLoadingCurrentBlockTxList(state) {
      return {...state, loadingCurrentBlockTxList: true}
    },
    hideLoadingCurrentBlockTxList(state) {
      return {...state, loadingCurrentBlockTxList: false}
    },
    showLoadingCurrentTxInfo(state) {
      return {...state, loadingCurrentTxInfo: true}
    },
    hideLoadingCurrentTxInfo(state) {
      return {...state, loadingCurrentTxInfo: false}
    },
    showLoadingChainCodes(state) {
      return {...state, loadingChainCodes: true}
    },
    hideLoadingChainCodes(state) {
      return {...state, loadingChainCodes: false}
    }
  },

  subscriptions: {
    setup({ history }) {
    },
  },
};
