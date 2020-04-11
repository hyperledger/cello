import { queryRule, removeRule } from '../services/api';
import { getPeersForOrg, addPeers, getPeersForChannel } from '../services/AddPeer'
import {routerRedux} from "dva/router";
import { message } from 'antd';
import { IntlProvider, defineMessages } from 'react-intl';

import { getLocale } from '../utils/utils';

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

const messages = defineMessages({
    adding: {
        id: 'Channel.AddingPeer',
        defaultMessage: 'Adding nodes to the channel...',
    },
    addSuccess: {
        id: 'Channel.AddPeerSuccess',
        defaultMessage: 'Node added successfully',
    },
});

export default {
    namespace: 'AddPeer',

    state: {
        data: {
            list: [],
            selected: [],
            pagination: {},
        },
    },

    effects: {
        *fetch({ payload }, { call, put }) {
            const response = yield call(queryRule, payload);
            yield put({
            type: 'save',
            payload: response,
            });
        },
        *getPeersForChannel({ payload }, { call, put }) {

            let key = 0;
            const peers = yield call(getPeersForOrg);
            const peersName = [];

            for (const peer in peers.peers){
                peersName.push({
                    'key': key++,
                    'name':peers.peers[peer].name,
                });
            }

            const disableRow = [];
            //获取已加入当前channel的peers
            if (peersName.length > 0){
                const peersInChannel = yield call(getPeersForChannel, payload.channel_id);
                for (const peerFromChannel in peersInChannel.peers){
                    for (const peerFromOrg in peersName) {
                        //找到已经加入到channel的peer
                        if (peersInChannel.peers[peerFromChannel].name === peersName[peerFromOrg].name){
                            let roles = [];
                            if (peersInChannel.peers[peerFromChannel].roles.chaincodeQuery) {
                                roles.push('chaincodeQuery');
                            }
                            if (peersInChannel.peers[peerFromChannel].roles.endorsingPeer) {
                                roles.push('endorsingPeer');
                            }
                            if (peersInChannel.peers[peerFromChannel].roles.ledgerQuery) {
                                roles.push('ledgerQuery');
                            }
                            disableRow.push(peersName[peerFromOrg].key);
                            peersName[peerFromOrg].role = roles.join(', ');
                        }
                    }
                }
            }

            yield put({
                type: 'save',
                payload: {
                    list : peersName,
                    selected : disableRow,
                }
            });
        },

        *add({ payload, callback }, { call, put }) {
            message.loading(intl.formatMessage(messages.adding), 3);
            try {
                const response = yield call(addPeers, payload);
                if (response.joinPeers.success){
                    message.success(intl.formatMessage(messages.addSuccess));
                    yield put(
                        routerRedux.push({
                            pathname: 'ChannelList',
                        })
                    );
                }
                if (callback) callback();
            }
            catch (e) {
                callback();
            }

        },

        *remove({ payload, callback }, { call, put }) {
            const response = yield call(removeRule, payload);
            yield put({
                type: 'save',
                payload: response
            });
            if (callback) callback();
        },
    },

    reducers: {
        save(state, action) {
            return {
                ...state,
                data: action.payload
            };
        },
    },
};
