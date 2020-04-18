import { queryOrInvoke } from '../services/InstantChainCode_api';
import { message } from 'antd';
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from "../utils/utils";

const messages = defineMessages({
    querySuccess: {
        id: 'Channel.Detail.Instant.querySuccess',
        defaultMessage: 'Query Successfully',
    },
    queryFail: {
        id: 'Channel.Detail.Instant.queryFail',
        defaultMessage: 'Query failed',
    },
    executeSuccess: {
        id: 'Channel.Detail.Instant.executeSuccess',
        defaultMessage: 'Execute Successfully',
    },
    executeFail: {
        id: 'Channel.Detail.Instant.executeFail',
        defaultMessage: 'Execute Failed',
    },
});

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

export default {
    namespace: 'ChannelInstant',

    state: {
        InstantList: [],
    },


    effects: {
        *operate({ payload, callback }, { call, put }) {
            const operation=payload.chaincode_operation.operation;
            const response = yield call(queryOrInvoke, payload);
                yield put({
                    type: 'save',
                    payload: response,
                });

                if(operation=== 'query' ){        // query
                    if (response.success) {
                        message.success(intl.formatMessage(messages.querySuccess));
                    }
                    else{
                        message.error(intl.formatMessage(messages.queryFail));
                    }
                }
                else {                          // invoke
                    if (response.success) {
                        message.success(intl.formatMessage(messages.executeSuccess));
                    }
                    else{
                        message.error(intl.formatMessage(messages.executeFail));
                    }
                }
        },
        *remove({ payload, callback }, { call, put }) {
            const response = yield call(removeRule, payload);
            yield put({
                type: 'save',
                payload: response,
            });
            if (callback) callback();
        },
    },

    reducers: {
        save(state, action) {
            return {
                ...state,
                InstantList: action.payload,
            };
        },
    },
};
