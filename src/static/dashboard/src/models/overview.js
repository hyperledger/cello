/*
 SPDX-License-Identifier: Apache-2.0
*/
import { queryStatus } from '../services/overview';
import { queryNetworks } from '../services/network_api';
import { queryOrgList } from '../services/orgs_api';

export default {
    namespace: 'overview',

    state: {
        networkStatus: [],
        networkTypes: [],
        hostStatus: [],
        hostTypes: [],
        orgInNetwork: [],
        orgPercentage: []
    },

    effects: {
        *fetchNetworkStatus(_, { call, put }) {
            const networks = yield call(queryNetworks);
            let soloNum = 0;
            let kafkaNum = 0;
            let runningNum = 0;
            let freeNum = 0;

            for (const network in networks.blockchain_networks){
                if (networks.blockchain_networks[network].consensus_type === 'solo') {
                    soloNum++;
                }
                else {
                    kafkaNum++;
                }

                if (networks.blockchain_networks[network].status === 'running') {
                    runningNum++;
                }
                else {
                    freeNum++;
                }
            }

            const response = {
                status:[
                    {
                        name:'free',
                          y:freeNum
                    },
                    {
                        name:'used',
                          y:runningNum
                    }
                ],
                type:[
                    {
                        name:'solo',
                          y:soloNum
                    },
                    {
                        name:'kafka',
                          y:kafkaNum
                    }
                ]
            };
            yield put({
                type: 'setNetworkStatus',
                payload: response,
            });
        },
        *fetchHostStatus(_, { call, put }) {
            const response = yield call(queryStatus, { res: 'host' });
            yield put({
                type: 'setHostStatus',
                payload: response,
            });
        },
        *fetchOrgs(_, {call, put}) {
            const res = yield call(queryOrgList);

            //统计入网率
            const orgs = res.organizations;
            let In = 0;
            let Out = 0;
            let Peer = 0;
            let Orderer = 0;

            for (const org in orgs) {
                if (orgs[org].blockchain_network_id === '') {
                    Out++;
                }
                else {
                    In++;
                }

                if (orgs[org].type === 'peer') {
                    Peer++;
                }
                else {
                    Orderer++;
                }
            }

            const response = {
                orgInNetwork:[
                    {
                        name: 'In',
                        y: In
                    },
                    {
                        name: 'Out',
                        y: Out
                    }
                ],
                orgPercentage: {
                    Peer: (Peer + Orderer) === 0 ? 0 : Peer / (Peer + Orderer),
                    Orderer: (Peer + Orderer) === 0 ? 0 : Orderer / (Peer + Orderer)
                }
            };

            yield put({
                type: 'setOrgs',
                payload: response,
            });
        }
    },

    reducers: {
        setOrgs(state, action) {
            const { orgInNetwork } = action.payload;
            const statusData = orgInNetwork.map(item => {
                return {
                    x: item.name,
                    y: item.y,
                };
            });
            return {
                ...state,
                orgInNetwork: statusData,
                orgPercentage: action.payload.orgPercentage,
            };
        },
        setNetworkStatus(state, action) {
            const { status, type } = action.payload;
            const statusData = status.map(item => {
                return {
                    x: item.name,
                    y: item.y,
                };
            });
            const typeData = type.map(item => {
                return {
                    x: item.name,
                    y: item.y,
                };
            });
            return {
                ...state,
                networkStatus: statusData,
                networkTypes: typeData,
            };
        },
        setHostStatus(state, action) {
            const { status, type } = action.payload;
            const statusData = status.map(item => {
                return {
                    x: item.name,
                    y: item.y,
                };
            });
            const typeData = type.map(item => {
                return {
                    x: item.name,
                    y: item.y,
                };
            });
            return {
                ...state,
                hostStatus: statusData,
                hostTypes: typeData,
            };
        },
    },
};
