import { queryOrInvoke } from '../services/InstantChainCode_api';
import {getPeersForOrg} from "../services/AddPeer";
import {queryOneChainCode, instantiateCC, upgradeCC, queryChainCode} from "../services/chaincode_api";
import { message } from 'antd';
import {queryOneChannel} from "../services/channel_api";
import {queryOneOrg} from "../services/orgs_api";
import {queryChannelPeers} from "../services/peerList_api";
import {queryNetworks} from "../services/network_api";
import { routerRedux } from 'dva/router';
import {stringify} from "qs";
export default {
    namespace: 'InstantChainCode',

    state: {
        Instant: [],
    },


    effects: {
        *fetch({ payload }, { call, put }) {
            const id=payload.id;
            const response = yield call(getPeersForOrg, id);  //  获取组织中peer
            const peerOptions = Array.isArray(response.peers) ? response.peers: [];

            const CCList= yield call(queryOneChainCode, id);   //通过ID获取chaincode列表

            const CCListpeers= Array.isArray(CCList.chaincode.peers) ? CCList.chaincode.peers: [];  //获取chaincode中已经安装过的peers
            const AllpeerNames = [];

            for(let i=0;i<peerOptions.length;i++) {
                let bput = true;
                for(let j=0; j < CCListpeers.length; j++){
                    if(peerOptions[i].name === CCListpeers[j].peer_name){
                        bput = false;
                        break;      //  已被安装的节点就跳过
                    }
                }
                if (bput){
                    AllpeerNames.push(peerOptions[i]);
                }
            }

            yield put({
                type: 'save',
                payload: AllpeerNames,
            });
        },


        *instantiate({ payload, callback }, { call, put }) {

            const response = yield call(instantiateCC, payload);
            if (`${response.success}`=== '200') {
                message.success('实例化链码成功!');
            }
            yield put(
                routerRedux.push({
                    pathname: 'ChainCodeList',
                })
            );
        },

        *upgrade({ payload, callback }, { call, put }) {
            const response = yield call(upgradeCC, payload);
            console.log("id:",payload);
            if (`${response.success}`=== '200') {
                message.success('升级链码成功!');
            }
            yield put(
                routerRedux.push({
                    pathname: 'ChannelDetail',
                    search: stringify({
                        id: payload.upgrade.channel_id,
                    })
                })
            );
        },


        *fetchInstantCC({ payload }, { call, put }) {
            const id=payload.id;
            const response = yield call(queryChainCode);
            const chainCodeList=response.chaincodes;
            const Instant=[];

            for(let i=0;i<chainCodeList.length;i++){
                for(let j=0;j<chainCodeList[i].channel_ids.length;j++){
                    if(chainCodeList[i].channel_ids[j]===id){     //  通过通道ID去获取实例化的链码列表
                        Instant.push(chainCodeList[i]);
                    }
                }
            }
         //   Instant.push(chainCodeList[0]);    //验证单选，需要删除
            yield put({
                type: 'save',
                payload: Instant,
            });
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
                Instant: action.payload,
            };
        },
    },
};
