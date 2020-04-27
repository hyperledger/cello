/*
 SPDX-License-Identifier: Apache-2.0
*/
import { queryOrgList } from '../services/orgs_api';
import {queryChannels} from "../services/channel_api";
import {queryChannelPeers} from "../services/peerList_api";
import {queryChainCode} from "../services/chaincode_api";
import { queryTransactionRealtime, queryBlockByNumber, queryBlockByTime } from "../services/overview";
import { IntlProvider, defineMessages } from 'react-intl';
import {getLocale} from "../utils/utils";
import moment from 'moment';

const messages = defineMessages({
    nodeChannel: {
        id: 'Overview.ChannelOverview.NodeChannel',
        defaultMessage: 'Node',
    },
    freeChannel: {
        id: 'Overview.ChannelOverview.NodefreeChannel',
        defaultMessage: 'None Node',
    },
    thisUser: {
        id: 'Overview.ChannelOverview.This',
        defaultMessage: 'I Created',
    },
    otherUser: {
        id: 'Overview.ChannelOverview.Other',
        defaultMessage: 'Others Created',
    },
    iUpload:{
        id: 'Overview.ChaincodeOverview.IUploadCC',
        defaultMessage: 'I uploaded',
    },
    oUpload:{
        id: 'Overview.ChaincodeOverview.OUploadCC',
        defaultMessage: 'Others uploaded',
    },
    install:{
        id: 'Overview.ChaincodeOverview.InstalledCC',
        defaultMessage: 'Installed',
    },
    unInstall:{
        id: 'Overview.ChaincodeOverview.UninstallCC',
        defaultMessage: 'Uninstalled',
    },
    instance:{
        id: 'Overview.ChaincodeOverview.InstancedCC',
        defaultMessage: 'Instantiated',
    },
    unInstance:{
        id: 'Overview.ChaincodeOverview.UninstanceCC',
        defaultMessage: 'Uninstantiated',
    },
});
const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

export default {
    namespace: 'overview',

    state: {
        allChannels: [],
        peerClPercent: [],
        userCtCls:[],
        UploadCCs: [],
        installCCs:[],
        instantCCs:[],
        channels:[],
        channels_init:[],
        channelIds: [],
        txRealtime: [],
        blocks: {blocks:[]},
        transactions: {trans:[]}
    },

    effects: {
        *fetchChannels(_, {call, put}) {

            //已加入节点的通道占比
            const cls = yield call(queryChannels);
            const ClLength=cls.channels.length;
            const myUser=window.username;
            let mycl=0;
            let nocl=0;
            let peercl=0;
            
            if(ClLength>0){
                for(let i=0;i<ClLength;i++){
                    const clCreator=cls.channels[i].creator_name;

                    if(clCreator===myUser){
                        mycl++;
                    }

                    const channelId=cls.channels[i].id;
                    const channelID={id:channelId};
                    const channelPeers = yield call(queryChannelPeers,channelID);
                    if (channelPeers.peers.length===0){
                        nocl++;
                        cls.channels[i].peers = [];
                    }
                    else {
                        peercl++;
                        cls.channels[i].peers = channelPeers.peers;
                    }
                }
            }

            const othercl=ClLength-mycl;

            const response = {
                allChannels:[
                    {
                        name:  intl.formatMessage(messages.nodeChannel) ,
                        y: peercl
                    },
                    {
                        name: intl.formatMessage(messages.freeChannel),
                        y: nocl
                    }
                ],
                userCtCls:[
                    {
                        name: intl.formatMessage(messages.thisUser),
                        y: mycl
                    },
                    {
                        name: intl.formatMessage(messages.otherUser),
                        y: othercl
                    }
                ],
                channels: cls.channels
            };

            yield put({
                type: 'setPeerCl',
                payload: response,
            });
        },
        *fetchChainCodes(_, {call, put}) {
            const ccs = yield call(queryChainCode);
            const CCLength = ccs.chaincodes.length;
            const myUser = window.username;
            const channelIds = [];
            let myupload = 0;

            let peercc = 0;
            let nopeercc = 0;

            let instantcc=0;
            let noinstantcc=0;

            if (CCLength > 0) {
                for (let i = 0; i < CCLength; i++) {
                    const ccCreator = ccs.chaincodes[i].creator_name;
                    if (ccCreator === myUser) {
                        myupload++;
                    }

                    const ccpeer = ccs.chaincodes[i].peers;
                    if (ccpeer.length=== 0) {
                        nopeercc++;
                    }
                    else {
                        peercc++;
                    }
                    const ccChannel = ccs.chaincodes[i].channel_ids;
                    if (ccChannel.length=== 0) {
                        noinstantcc++;
                    }
                    else {
                        instantcc++;
                    }
                    ccChannel.map(channel => {
                        channelIds.push(channel);
                    });
                }
            }

            const otherupload = CCLength - myupload;

            const response = {
                UploadCCs: [
                    {
                        name: intl.formatMessage(messages.iUpload),
                        y: myupload
                    },
                    {
                        name: intl.formatMessage(messages.oUpload),
                        y: otherupload
                    }
                ],
                installCCs: [
                    {
                        name: intl.formatMessage(messages.install),
                        y: peercc,
                    },
                    {
                        name: intl.formatMessage(messages.unInstall),
                        y: nopeercc,
                    }
                ],

                instantCCs: [
                    {
                        name: intl.formatMessage(messages.instance),
                        y: instantcc
                    },
                    {
                        name: intl.formatMessage(messages.unInstance),
                        y: noinstantcc
                    }
                ],
                channelIds: channelIds
            };

            yield put({
                type: 'setCCs',
                payload: response,
            });
        },
        *fetchTransactionRealtime({ payload }, {call, put}) {
            const txs = yield call(queryTransactionRealtime, payload);

            if (!txs.success) {
                return;
            }

            const txList = [];
            let totalTx = 0;
            for (let i = 0;i < txs.transactions.length;i++) {
                const time = new Date(txs.transactions[i].time);
    
                txList.push({
                    time: time.getTime(),
                    count: txs.transactions[i].count,
                    type: `${txs.channelName} | ${payload.peerName}`
                });
                totalTx += txs.transactions[i].count;
            }
            
            let tps = totalTx / ((txList[txList.length -1].time - txList[0].time ) / 1000 + 60);
            
            if (tps > 0) {
                if (tps.toFixed(2) < 0.01) {
                    tps = 'little';
                }
                else {
                    tps = tps.toFixed(2);
                }
            }
            yield put({
                type: 'savetx',
                payload: {
                    txList: txList,
                    peerName: payload.peerName,
                    channel_id: payload.channel_id,
                    tps: tps
                },
            });
        },
        *fetchBlock({ payload }, {call, put}) {
            let txs;
            if (payload.type === '0') {
                txs = yield call(queryBlockByNumber, payload);
            }
            else {
                txs = yield call(queryBlockByTime, payload);
            }

            if (!txs.success) {
                return;
            }

            const blockInfo = {};
            const blocks = [];
            let startTime = '';
            let endTime = '';
            let tps = -1;
            let totalTx = 0;

            for (let i = 0;i < txs.blocks.length;i++) {
                blocks.push({
                    currentBlockHash: txs.blocks[i].currentBlockHash,
                    dataHash: txs.blocks[i].dataHash,
                    number: txs.blocks[i].number,
                    previousHash: txs.blocks[i].previousHash,
                    txCount: txs.blocks[i].transaction.length,
                    txs: txs.blocks[i].transaction
                });
    
                totalTx += txs.blocks[i].transaction.length;
                for (let j = 0;j < txs.blocks[i].transaction.length;j++) {
                    const txTime = moment(txs.blocks[i].transaction[j].time).format('YYYY-MM-DD HH:mm:ss');
                    if ( startTime === '' || txTime < startTime) {
                        startTime = txTime;
                    }
        
                    if ( endTime === '' || txTime > endTime) {
                        endTime = txTime;
                    }
                }
    
            }
            if (endTime > startTime) {
                try {
                    tps = totalTx / (((new Date(endTime)).getTime() - (new Date(startTime)).getTime()) / 1000);
                    if ( tps.toFixed(2) > 0 ) {
                        tps = tps.toFixed(2);
                    }
                    else {
                        tps = 'little';
                    }
                }
                catch (e) {
                    console.log(e.toString());
                }
            }

            if (payload.type === '0') {
                blockInfo.number = payload.blockNum;
            }
            else {
                blockInfo.startTime = new Date(payload.startTime);
                blockInfo.endTime = new Date(payload.endTime);
            }
            blockInfo.tps = tps;
            blockInfo.type = payload.type;
            blockInfo.channel = payload.channel;
            blockInfo.blocks = blocks;
            blockInfo.peerName = payload.peerName;

            yield put({
                type: 'saveblocks',
                payload: blockInfo,
            });
        },
        *fetchTransactions({payload}, {call, put}) {
            const res = {};
            const txs = [];

            if (payload.type === '0') {
                const blocks = yield call(queryBlockByNumber, payload);

                if (!blocks.success) {
                    return;
                }
                
                let startTime = '';
                let endTime = '';
                let tps = -1;

                for (let i = 0;i < blocks.blocks.length;i++) {
                    for (let j = 0;j < blocks.blocks[i].transaction.length;j++) {
                        txs.push(blocks.blocks[i].transaction[j]);
                        const txTime = moment(blocks.blocks[i].transaction[j].time).format('YYYY-MM-DD HH:mm:ss');
                        if ( startTime === '' || txTime < startTime) {
                            startTime = txTime;
                        }
                        
                        if ( endTime === '' || txTime > endTime) {
                            endTime = txTime;
                        }
                    }
                }
                
                if (endTime > startTime) {
                    try {
                        tps = txs.length / (((new Date(endTime)).getTime() - (new Date(startTime)).getTime()) / 1000);
                        if ( tps.toFixed(2) > 0 ) {
                            tps = tps.toFixed(2);
                        }
                        else {
                            tps = 'little';
                        }
                    }
                    catch (e) {
                        console.log(e.toString());
                    }
                }

                res.tps = tps;
                res.trans = txs;
                res.channel = payload.channel;
                res.type = payload.type;
                res.number = payload.blockNum;
                res.peerName = payload.peerName;
            }
            else {
                const blocks = yield call(queryBlockByTime, payload);

                if (!blocks.success) {
                    return;
                }
    
                let startTime = '';
                let endTime = '';
                let tps = -1;

                for (let i = 0;i < blocks.blocks.length;i++) {
                    for (let j = 0;j < blocks.blocks[i].transaction.length;j++) {
                        txs.push(blocks.blocks[i].transaction[j]);
                        const txTime = moment(blocks.blocks[i].transaction[j].time).format('YYYY-MM-DD HH:mm:ss');
                        if ( startTime === '' || txTime < startTime) {
                            startTime = txTime;
                        }
    
                        if ( endTime === '' || txTime > endTime) {
                            endTime = txTime;
                        }
                    }
                }
    
                if (endTime > startTime) {
                    try {
                        tps = txs.length / (((new Date(endTime)).getTime() - (new Date(startTime)).getTime()) / 1000);
                        if ( tps.toFixed(2) > 0 ) {
                            tps = tps.toFixed(2);
                        }
                        else {
                            tps = 'little';
                        }
                    }
                    catch (e) {
                        console.log(e.toString());
                    }
                }
    
                res.tps = tps;
                res.trans = txs;
                res.channel = payload.channel;
                res.type = payload.type;
                res.startTime = new Date(payload.startTime);
                res.endTime = new Date(payload.endTime);
                res.peerName = payload.peerName;
            }
            res.commit = payload.commit;

            yield put({
                type: 'savetxList',
                payload: res,
            });
        }
    },

    reducers: {
        savetx(state, action) {
            return {
                ...state,
              txRealtime: action.payload,
            };
        },
        saveblocks(state, action) {
            return {
                ...state,
                blocks: action.payload,
            };
        },
        savetxList(state, action) {
            return {
                ...state,
                transactions: action.payload,
            };
        },
        setPeerCl(state, action) {
            const { allChannels, userCtCls, channels } = action.payload;
            const statusData = allChannels.map(item => {
                return {
                    x: item.name,
                    y: item.y,
                };
            });
            const psClData = userCtCls.map(item => {
                return {
                    x: item.name,
                    y: item.y,
                };
            });
            return {
                ...state,
                allChannels: statusData,
                userCtCls:psClData,
                channels: channels
            };
        },
        setCCs(state, action) {
            const { UploadCCs,installCCs,instantCCs,channelIds } = action.payload;
            const uploadData = UploadCCs.map(item => {
                return {
                    x: item.name,
                    y: item.y,
                };
            });
            const installData = installCCs.map(item => {
                return {
                    x: item.name,
                    y: item.y,
                };
            });
            const instantData = instantCCs.map(item => {
                return {
                    x: item.name,
                    y: item.y,
                };
            });
            return {
                ...state,
                UploadCCs: uploadData,
                installCCs:installData,
                instantCCs:instantData,
                channelIds:channelIds
            };
        },
    },
};
