/*
 SPDX-License-Identifier: Apache-2.0
*/
import { message } from 'antd';
import { IntlProvider, defineMessages } from 'react-intl';
import {
    query as queryChannel,
    queryCurrent,
    createChannel,
    deleteChannel,
    updateChannel,
} from '../services/channel';
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
                id: 'ChannelList.Messages.Operate.Success.Create',
                defaultMessage: '创建通道 {name} 成功',
            },
            edit: {
                id: 'ChannelList.Messages.Operate.Success.Update',
                defaultMessage: '更新通道 {name} 成功',
            },
            delete: {
                id: 'ChannelList.Messages.Operate.Success.Delete',
                defaultMessage: '删除通道 {name} 成功',
            },
        },
    },
});

export default {
    namespace: 'channel',

    state: {
        users: [],
        total: 0,
        pageNo: 1,
        pageSize: 10,
        currentUser: {},
    },

    effects: {
        *fetch(_, { call, put }) {
            const response = yield call(queryChannel);
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
        *createChannel({ payload }, { call, put }) {
            const response = yield call(createChannel, payload);
            if (response.status === 'OK') {
                const values = { name: payload.username };
                message.success(intl.formatMessage(messages.operate.success.create, values));
            }
            yield call(payload.callback);
            yield put({
                type: 'fetch',
            });
        },
        *deleteChannel({ payload }, { call, put }) {
            const response = yield call(deleteChannel, payload.id);
            const jsonResponse = JSON.parse(response);
            if (jsonResponse.status === 'OK') {
                const values = { name: payload.name };
                message.success(intl.formatMessage(messages.operate.success.delete, values));
            }
            yield put({
                type: 'fetch',
            });
        },
        *updateChannel({ payload }, { call, put }) {
            const response = yield call(updateChannel, payload);
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
