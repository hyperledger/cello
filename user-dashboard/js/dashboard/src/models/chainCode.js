/*
 SPDX-License-Identifier: Apache-2.0
*/
import {listChainCodes, deleteChainCode, instantiateChainCode, callChainCode,
  editChainCode, installChainCode} from '../services/chainCode'
import {message} from 'antd'
import { routerRedux } from 'dva/router'
import { FormattedMessage, IntlProvider, defineMessages } from 'react-intl';
const appLocale = window.appLocale;
const intlProvider = new IntlProvider({ locale: appLocale.locale, messages: appLocale.messages }, {});
const { intl } = intlProvider.getChildContext();

const messages = defineMessages({
  success: {
    deleteChainCode: {
      id: "ChainCode.message.success.deleteChainCode",
      defaultMessage: "删除智能合约 {name} 成功."
    },
    updateChainCode: {
      id: "ChainCode.message.success.updateChainCode",
      defaultMessage: "更新智能合约成功"
    },
    installChainCode: {
      id: "ChainCode.message.success.installChainCode",
      defaultMessage: "安装智能合约成功"
    },
    instantiateChainCode: {
      id: "ChainCode.message.success.instantiateChainCode",
      defaultMessage: "部署智能合约任务提交成功"
    },
    instantiateChainCodeDone: {
      id: "ChainCode.message.success.instantiateChainCodeDone",
      defaultMessage: "部署智能合约任务完成"
    }
  },
  fail: {
    deleteChainCode: {
      id: "ChainCode.message.fail.deleteChainCode",
      defaultMessage: "删除智能合约 {name} 失败."
    },
    updateChainCode: {
      id: "ChainCode.message.fail.updateChainCode",
      defaultMessage: "更新智能合约失败"
    },
    installChainCode: {
      id: "ChainCode.message.fail.installChainCode",
      defaultMessage: "安装智能合约失败"
    },
    instantiateChainCode: {
      id: "ChainCode.message.fail.instantiateChainCode",
      defaultMessage: "部署智能合约失败"
    },
    listChainCode: {
      id: "ChainCode.message.fail.listChainCode",
      defaultMessage: "列取智能合约失败"
    }
  }
})

export default {
  namespace: 'chainCode',

  state: {
    chainCodes: [],
    loadingChainCodes: false,
    calling: false,
    callResult: {
      success: true,
      message: ""
    },
    editing: false,
    installing: false,
    editModalVisible: false,
    installModalVisible: false,
    instantiateModalVisible: false,
    currentChainCode: null
  },

  effects: {
    * queryChainCodes ({payload}, {call, put}) {
      const data = yield call(listChainCodes, payload)
      if (data && data.success) {
        yield put({type: 'setChainCodes', payload: {chainCodes: data.chainCodes}})
      } else {
        message.error(intl.formatMessage(messages.fail.listChainCode))
        yield put({type: 'setChainCodes', payload: {chains: []}})
      }
    },
    *deleteChainCode ({payload}, {call, put}) {
      const data = yield call(deleteChainCode, payload)
      if (data && data.success) {
        yield put({
          type: 'removeChainCode',
          payload: {
            id: payload.id
          }
        })
        message.success(intl.formatMessage(messages.success.deleteChainCode, {name: payload.name}))
      }
    },
    *editChainCode ({payload}, {call, put}) {
      const data = yield call(editChainCode, payload)
      if (data && data.success) {
        yield put({
          type: 'updateChainCode',
          payload
        })
        yield put({
          type: 'hideEditModal'
        })
        message.success(intl.formatMessage(messages.success.updateChainCode))
      } else {
        message.error(intl.formatMessage(messages.fail.updateChainCode))
      }
    },
    *installChainCode ({payload}, {call, put}) {
      const data = yield call(installChainCode, payload)
      if (data && data.success) {
        yield put({
          type: 'updateChainCode',
          payload: {
            ...payload,
            status: "installed"
          }
        })
        yield put({
          type: 'hideInstallModal'
        })
        message.success(intl.formatMessage(messages.success.installChainCode))
      } else {
        message.error(intl.formatMessage(messages.fail.installChainCode))
      }
    },
    *instantiateChainCode ({payload}, {call, put}) {
      const data = yield call(instantiateChainCode, payload)
      if (data && data.success) {
        yield put({
          type: 'updateChainCode',
          payload: {
            ...payload,
            status: "instantiating"
          }
        })
        yield put({
          type: 'hideInstantiateModal'
        })
        message.success(intl.formatMessage(messages.success.instantiateChainCode))
      } else {
        message.error(intl.formatMessage(messages.fail.instantiateChainCode))
      }
    },
    *instantiateDone ({payload}, {call, put}) {
      yield put({
        type: 'updateChainCode',
        payload: {
          id: payload.id,
          chainName: payload.chainName,
          status: "instantiated"
        }
      })
      message.success(intl.formatMessage(messages.success.instantiateChainCodeDone))
    },
    *callChainCode ({payload}, {call, put}) {
      yield put({type: 'setCalling'})
      const data = yield call(callChainCode, payload)
      yield put({
        type: 'setCallResult',
        payload: {
          callResult: data
        }
      })
    }
  },

  reducers: {
    showLoading(state) {
      return {...state, loadingChainCodes: true}
    },
    setChainCodes(state, {payload: {chainCodes}}) {
      return {...state, chainCodes, loadingChainCodes: false}
    },
    removeChainCode(state, {payload: {id}}) {
      const {chainCodes} = state;
      const remainChainCodes = chainCodes.filter(item => item.id !== id);
      return {...state, chainCodes: remainChainCodes}
    },
    updateChainCode(state, {payload: {id, name, status, chainName}}) {
      let {chainCodes} = state;
      chainCodes.forEach(function (chainCode, index, _ary) {
        if (chainCode.id === id) {
          if (name) {
            chainCode.name = name;
          }
          if (status) {
            chainCode.status = status;
          }
          if (chainName) {
            chainCode.chainName = chainName;
          }
          chainCodes[index] = chainCode
          return false
        } else {
          return true
        }
      })
      return {...state, chainCodes}
    },
    showEditModal(state, {payload: {currentChainCode}}) {
      return {...state, currentChainCode, editModalVisible: true}
    },
    hideEditModal(state) {
      return {...state, editModalVisible: false, currentChainCode: null}
    },
    setInstalling(state) {
      return {...state, installing: true}
    },
    showInstallModal(state, {payload: {currentChainCode}}) {
      return {...state, currentChainCode, installModalVisible: true}
    },
    hideInstallModal(state) {
      return {...state, installModalVisible: false, currentChainCode: null, installing: false}
    },
    showInstantiateModal(state, {payload: {currentChainCode}}) {
      return {...state, currentChainCode, instantiateModalVisible: true}
    },
    hideInstantiateModal(state) {
      return {...state, instantiateModalVisible: false, currentChainCode: null}
    },
    setCalling(state) {
      return {...state, calling: true}
    },
    setCallResult(state, {payload: {callResult}}) {
      return {...state, callResult, calling: false}
    },
    clear(state) {
      return {...state, callResult: {
          success: true,
          message: ""
        }, chainCodes: [], currentChainCode: null}
    }
  },

  subscriptions: {
    setup({ history }) {
    },
  },
};
