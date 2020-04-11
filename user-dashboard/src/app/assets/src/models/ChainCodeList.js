import { routerRedux } from 'dva/router';
import { queryChainCode, installChainCode,deleteChainCode, addChainCode, createChainCode  } from '../services/chaincode_api';
import {queryNetworks} from "../services/network_api";
// import {message} from "antd/lib/index";
import { message } from 'antd';
import {getLocale} from "../utils/utils";
import {defineMessages, IntlProvider} from "react-intl";

const messages = defineMessages({
    success: {
        id: 'ChainCode.Install.Success',
        defaultMessage: 'Install chainCode success',
    },
});

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();


export default {
    namespace: 'ChainCodeList',
    
    state: {
        chaincodes: [],
    },
    
    effects: {
        *fetch({ payload }, { call, put }) {
            const response = yield call(queryChainCode, payload);
            const chainCodeResponse=response.chaincodes;   //链码列表
            yield put({
                type: 'save',
                payload: response,
            });
        },
        
        *install({ payload}, { call, put }) {
            const response = yield call(installChainCode, payload);
            message.success(intl.formatMessage(messages.success));
            yield put(
                routerRedux.push({
                    pathname: '/ChainCode/ChainCodeList',
                })
            );
            
        },
        
        *create({ payload}, { call, put }) {
            const response = yield call(createChainCode, payload);
            if (response && response.message === 'Ok') {
                yield put(
                    routerRedux.push({
                        pathname: '/ChainCode/ChainCodeDetail',
                    })
                );
            }
        },
        
        *removeChainCode({ payload }, { call, put }) {
            console.log('deleteCC');
            console.log(payload);
            const response = yield call(deleteChainCode, payload.id);
            /*  const jsonResponse = JSON.parse(response);
              if (jsonResponse.status === 'OK') {
                  const values = { name: payload.name };
                  message.success(intl.formatMessage(messages.operate.success.delete, values));
              }  */
            yield put({
                type: 'fetch',
            });
        },
        
        
        *remove({ payload, callback }, { call, put }) {
            const response = yield call(removeChainCode, payload);
            yield put({
                type: 'save',
                payload: response,
            });
            if (callback) callback();
        },
    },
    
    
    *add({ payload, callback }, { call, put }) {
        const response = yield call(addChainCode, payload);
        yield put({
            type: 'save',
            payload: response,
        });
        if (callback) callback();
    },
    
    
    reducers: {
        save(state, action) {
            return {
                ...state,
                chaincodes: action.payload,
            };
        },
    },
};
