import { queryNetworks, removeNetwork, addNetwork, queryNetwork, netAddOrg, queryCpuInfo, queryMemoryInfo, queryNetworkInfo, queryNetworkHealthy } from '../services/network_api';
import { routerRedux } from "dva/router";
import { queryHost, queryHosts } from "../services/host.js";
import { queryOrgList, queryOrgByName } from "../services/orgs_api";
import {Modal} from "antd/lib/index";
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from "../utils/utils";

const messages = defineMessages({
    fetchOrgFail: {
        id: 'Network.FetchOrgFail',
        defaultMessage: 'Failed to get organization information',
    },
    fetchPeerFail: {
        id: 'Network.FetchPeerFail',
        defaultMessage: 'Failed to get node information',
    },
    fetchNetworkFail: {
        id: 'Network.FetchNetworkFail',
        defaultMessage: 'Failed to get network information',
    },
    fetchHostFail: {
        id: 'Network.FetchHostFail',
        defaultMessage: 'Failed to get host information',
    },
    createNetworkFail: {
        id: 'Network.CreateNetworkFail',
        defaultMessage: 'Failed to create the network',
    },
    deleteNetworkFail: {
        id: 'Network.deleteNetworkFail',
        defaultMessage: 'Failed to delete the network',
    },
    appendOrgFail: {
        id: 'Network.appendOrgFail',
        defaultMessage: 'Failed to append organization',
    },
});

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

export default {
    namespace: 'networklist',

    state: {
        blockchain_networks: [],
        peerInfo: [],
        orgInfo: [],
        healthyList: [],
    },

    effects: {
        *fetch({ payload }, { call, put }) {
            const response = yield call(queryNetworks, payload);
            if (typeof(response.error_code) !== 'undefined' && response.error_code) {
                Modal.warning({
                    title:intl.formatMessage(messages.fetchNetworkFail),
                    content: response.msg
                });
            }
            yield put({
                type: 'save',
                payload: response,
            });
        },
        *fetchForAddNetwork({ payload }, { call, put }) {
            const orgs = yield call(queryOrgList);

            if (typeof(orgs.error_code) !== 'undefined' && orgs.error_code) {
                Modal.warning({
                    title:intl.formatMessage(messages.fetchOrgFail),
                    content: orgs.msg
                });
                return;
            }

            //请求主机信息
            const hosts = yield call(queryHosts);
            if (hosts.code !== 200) {
                Modal.warning({
                    title:intl.formatMessage(messages.fetchHostFail),
                });
                return;
            }

            const baseInfor = {
                orgs: orgs.organizations,
                hosts: hosts.data
            };

            yield put({
                type: 'save',
                payload: baseInfor,
            });
        },
        *addnetwork({ payload, callback }, { call, put }) {
            const response = yield call(addNetwork, payload);

            if (typeof(response.error_code) !== 'undefined' && response.error_code) {
                Modal.warning({
                    title:intl.formatMessage(messages.createNetworkFail),
                    content: response.msg
                });
                return;
            }

            yield put(
                routerRedux.push({
                    pathname: 'networklist',
                })
            );
            if (callback) callback();
        },
        *fetchNetworkDetail({ payload }, { call, put }){
            const network = yield call(queryNetwork, payload.netId);
            let networkDetail = {};
            if (typeof(network.error_code) !== 'undefined'){
                Modal.warning({
                    title:intl.formatMessage(messages.fetchNetworkFail),
                    content: network.msg
                });
                networkDetail = {
                    consensus_type: '',
                    create_ts: '',
                    description: '',
                    fabric_version: '',
                    healthy: '',
                    id: '',
                    name: '',
                    status: ''
                };
            }
            else {
                //构造网络详情结构信息
                networkDetail = {
                    consensus_type: network.blockchain_network.consensus_type,
                    create_ts: network.blockchain_network.create_ts,
                    description: network.blockchain_network.description,
                    fabric_version: network.blockchain_network.fabric_version,
                    healthy: network.blockchain_network.healthy,
                    id: network.blockchain_network.id,
                    name: network.blockchain_network.name,
                    status: network.blockchain_network.status
                };
            }

            //请求主机信息
            const host = yield call(queryHost, {id: network.blockchain_network.host_id});

            if (typeof(host.data) === 'undefined'){
                networkDetail.hostname = 'unknown';
                Modal.warning({
                    title:intl.formatMessage(messages.fetchHostFail),
                });
            }
            else {
                networkDetail.hostname = host.data.name;
            }

            //请求orderer组织信息,peer组织信息
            const orgs = yield call(queryOrgList);

            if (typeof(orgs.error_code) !== 'undefined'){
                networkDetail.orderer_orgs = [];
                networkDetail.peer_orgs = [];
                Modal.warning({
                    title:intl.formatMessage(messages.fetchOrgFail),
                    content: orgs.msg
                });
                return ;
            }
            
            //整合数据，筛选加入到当前网络的组织
            const Orgs = [];
            const orgsInfor = orgs.organizations;
            for (const org in orgsInfor){
                if (orgsInfor[org].blockchain_network_id === network.blockchain_network.id) {
                    Orgs.push(
                        {
                            name: orgsInfor[org].name,
                            type: orgsInfor[org].type,
                            id: orgsInfor[org].id,
                            peerNum: orgsInfor[org].peerNum
                        }
                    );
                }
            }

            networkDetail.list = Orgs;

            yield put({
                type: 'save',
                payload: networkDetail
            })
        },
        *fetchNetworkHealthy({ payload }, { call, put }) {
            const response = yield call(queryNetworkHealthy, payload.netId);
            const healthyList = response.healthy || [];
            const groups = {};
            let ret = [];
            healthyList.forEach(item => {
                const orgName = item.org_name;
                groups[orgName] = groups[orgName] || [];
                groups[orgName].push(item);
            })
            ret = Object.keys(groups).map(o => {
                return {org_name: o, serviceList: groups[o]}
            }).sort((a,b) => {
                return b.serviceList.length - a.serviceList.length
            })
            yield put({
                type: 'queryHealthyList',
                payload: ret,
            });
        },
        *remove({ payload, callback }, { call, put }) {
            const response = yield call(removeNetwork, payload);
            if (typeof(response.error_code) !== 'undefined'){
                Modal.warning({
                    title:intl.formatMessage(messages.deleteNetworkFail),
                    content: response.msg
                });
            }
            yield put({type: 'fetch'});
        },
        *netaddorg({ payload, callback }, { call, put }) {
            const response = yield call(netAddOrg, payload);

            if (typeof(response.error_code) !== 'undefined' && response.error_code) {
                Modal.warning({
                    title:intl.formatMessage(messages.appendOrgFail),
                    content: response.msg
                });
                return;
            }

            yield put(
                routerRedux.push({
                    pathname: 'networklist',
                })
            );
            if (callback) callback();
        },
        *fetchPeerInfo({ payload, callback }, { call, put }) {
            const cpuInfo = yield call(queryCpuInfo, payload);
            const cpuForPeer = {};
            let cpuMax = 0;
            cpuForPeer.limit = cpuInfo.node_cpuinfo.limited_cpu_usage;
            cpuForPeer.data = [];
            for (let i = 0;i < cpuInfo.node_cpuinfo.instant_cpu_usages.length;i++) {
                const data = {
                    time: new Date(cpuInfo.node_cpuinfo.instant_cpu_usages[i][0] * 1000),
                    used: Math.round(Number(cpuInfo.node_cpuinfo.instant_cpu_usages[i][1]) * 10000) / 10000,
                    type: 'CPU'
                };
                if (data.used > cpuMax) {
                    cpuMax = data.used;
                }
                
                cpuForPeer.data.push(data);
            }
            //cpuMax += 0.005;
    
            const memInfo = yield call(queryMemoryInfo, payload);
            const memForPeer = {};
            let memMax = 0;
            //最大内存（M）
            memForPeer.limit = (memInfo.node_meminfo.limited_mem_usage / 1024 / 1024).toFixed(2);
            memForPeer.data = [];
            for (let i = 0;i < memInfo.node_meminfo.instant_mem_usages.length;i++) {
                const memUsed = Number(memInfo.node_meminfo.instant_mem_usages[i][1]) / 1024 / 1024;
                const data = {
                    time: new Date(memInfo.node_meminfo.instant_mem_usages[i][0] * 1000),
                    used: Math.round(memUsed * 100) / 100,
                    type: 'Memory'
                };
    
                if (data.used > memMax) {
                    memMax = data.used;
                }
                memForPeer.data.push(data);
            }
            //memMax += 20;
    
            const netInfo = yield call(queryNetworkInfo, payload);
            const netForPeer = {};
            netForPeer.data = [];
            let netMax = 0;
            for (let i = 0;i <  netInfo.node_netinfo.instant_received_bytes.length;i++) {
                const data = {
                    time: new Date(netInfo.node_netinfo.instant_received_bytes[i][0] * 1000),
                    used: Math.round((Number(netInfo.node_netinfo.instant_received_bytes[i][1]) / 1024) * 100) / 100,
                    type: 'Network'
                };
                
                if (data.used > netMax) {
                    netMax = data.used;
                }
    
                netForPeer.data.push(data);
            }
            //netMax += 10;
    
            yield put({
                type: 'saveForPeer',
                payload: {
                    name: payload.peerName,
                    ip: payload.ip,
                    cpuForPeer,
                    memForPeer,
                    netForPeer,
                    netMax,
                    memMax,
                    cpuMax
                }
            })
        },
        *fetchOrgByName({ payload, callback }, { call, put }) {
            const org = yield call(queryOrgByName, payload);
            const infor = {...org.organizations[0]};
            
            infor.country = infor.ca.country;
            infor.province = infor.ca.province;
            infor.locality = infor.ca.locality;
            
            delete infor.ca;
            
            yield put({
                type: 'saveOrgInfo',
                payload: {
                    orgInfo: infor
                }
            })
        }
    },

    reducers: {
        save(state, action) {
            return {
                ...state,
                blockchain_networks: action.payload,
            };
        },
        saveForPeer(state, action) {
            return {
                ...state,
                peerInfo: action.payload
            }
        },
        saveOrgInfo(state, action) {
            return {
                ...state,
                orgInfo: action.payload.orgInfo
            }
        },
        clearPeerInfo(state, action) {
            return {
                ...state,
                peerInfo: []
            }
        },
        queryHealthyList(state, action) {
            return {
                ...state,
                healthyList: action.payload,
            };
        },
    },
};
