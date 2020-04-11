import { routerRedux } from 'dva/router';
import { queryRule, removeRule, addRule, createRule  } from '../services/ChainCodeDetail_api';
import {queryChainCode,queryOneChainCode} from "../services/chaincode_api";
import {queryNetworks} from "../services/network_api";
import {queryChannels, queryOneChannel} from "../services/channel_api";


export default {
    namespace: 'ChainCodeDetail',

    state: {
        chaincodes: [],
        chaincodesMatch: [],
    },

    effects: {
        *fetch({ payload }, { call, put }) {
            const response = yield call(queryRule, payload);
            yield put({
                type: 'save',
                payload: response,
            });
        },

        *fetchNet({ payload }, { call, put }) {
            const id=payload.id;
            const response = yield call(queryOneChainCode, id);    // payload ==chaincode_id
            const OneChainCode=response.chaincode;
            const channels=OneChainCode.channel_ids;

            OneChainCode.channelName = [];
            for(let i=0;i<channels.length;i++) {
                const OneChannel = yield call(queryOneChannel, channels[i]);
                const channelName = OneChannel.channel.name;
                //   typeof(ChannelName) === 'undefined';
                OneChainCode.channelName.push({channelName: channelName});

            }

            const querynetworkid=OneChainCode.blockchain_network_id;
            const network = yield call(queryNetworks,querynetworkid);
            const networkname=network.blockchain_network.name;
                  OneChainCode.network_name=networkname;

        /*    const peers=OneChainCode.peers;
            const date = new Date();

              const peersList = [];
              for(let i in peers){
                   peersList.push({
                       peers_name:peers[i].peer_name,
                       install_ts:peers[i].install_ts,
                   });
              }

              OneChainCode.peersList=peersList;  */

            const chaincodes=OneChainCode;
            yield put({
                type: 'save',
                payload: chaincodes,
            });
        },

        *fetchCCUpVer({ payload}, { call, put }) {
            const id=payload.id;
            const responseOne = yield call(queryOneChainCode, id);    // payload ==chaincode_id
            const responseAll = yield call(queryChainCode, payload);
            const chainCodeResponse = responseAll.chaincodes;   //链码列表
            const chaincodeOne = responseOne.chaincode;
            const chaincodesMatch = [];
            for(var item in chainCodeResponse) {
                if(chainCodeResponse[item].name === chaincodeOne.name && chainCodeResponse[item].version != chaincodeOne.version){
                    chaincodesMatch.push(chainCodeResponse[item]);
                }
            }
            yield put({
                type: 'saveM',
                payload: chaincodesMatch,
            });
        },

        *create({ payload}, { call, put }) {
            const response = yield call(createRule, payload);
            if (response && response.message === 'Ok') {
                yield put(
                    routerRedux.push({
                        pathname: '/ChainCode/ChainCodeDetail',
                    })
                );
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


    *add({ payload, callback }, { call, put }) {
        const response = yield call(addRule, payload);
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
        saveM(state, action) {
            return {
                ...state,
                chaincodesMatch: action.payload,
            };
        },
    },
};
