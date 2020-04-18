import { routerRedux } from 'dva/router';
import { queryOrgList, createOrg, searchOrgByName, deleteOrg, searchOrgById, updateOrg, appendPeer } from '../services/orgs_api';
import { queryNetwork, queryNetworks } from '../services/network_api';
import { createUser, query, deleteUser } from '../services/user';
import { Modal} from "antd/lib/index";
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from "../utils/utils";
import {queryHosts} from "../services/host";

const messages = defineMessages({
    fetchOrgFail: {
        id: 'Organization.FetchOrgFail',
        defaultMessage: 'Failed to get organizations\' information',
    },
    fetchNetworkFail: {
        id: 'Organization.FetchNetworkFail',
        defaultMessage: 'Failed to get network information',
    },
    createOrgFail: {
        id: 'Organization.CreateOrgFail',
        defaultMessage: 'Failure to create the organization',
    },
    createUserFail: {
        id: 'Organization.CreateUserFail',
        defaultMessage: 'Failed to create the organization\'s administrator account',
    },
    accessUserFail: {
        id: 'Organization.accessUserFail',
        defaultMessage: 'Failed to access user information,not creating user for "{name}".',
    },
    deleteOrgFail: {
        id: 'Organization.deleteOrgFail',
        defaultMessage: 'Delete organization failed',
    },
    deleteAccountFail: {
        id: 'Organization.deleteAccountFail',
        defaultMessage: 'Fail to delete the organization\'s administrator account',
    },
    fetchHostFail: {
        id: 'Network.FetchHostFail',
        defaultMessage: 'Failed to get host information',
    },
});

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

export default {
    namespace: 'organization',

    state: {
        organization: [],
    },

    effects: {
        *fetch({ payload }, { call, put }) {
            const orgRes = yield call(queryOrgList, payload);

            if (typeof(orgRes.error_code) !== 'undefined' && orgRes.error_code) {
                Modal.warning({
                    title:intl.formatMessage(messages.fetchOrgFail),
                    content: resOrg.msg
                });
            }
            const orgs = orgRes.organizations;
            const netRes = yield call(queryNetworks, payload);

            if (typeof(netRes.error_code) !== 'undefined' && netRes.error_code) {
                Modal.warning({
                    title:intl.formatMessage(messages.fetchNetworkFail),
                    content: netRes.msg
                });
                for (const org in orgs) {
                    orgs[org].network = '';
                }
            }
            else {
                const nets = netRes.blockchain_networks;

                for (const org in orgs){
                    if (orgs[org].blockchain_network_id !== '') {
                        for (const net in nets){
                            if (orgs[org].blockchain_network_id === nets[net].id){
                                orgs[org].network = nets[net].name;
                                break;
                            }
                        }
                    }
                    else {
                        orgs[org].network = '';
                    }
                }
            }
            yield put({
                type: 'queryList',
                payload: orgs,
            });
        },

        *createorg({ payload }, { call, put }) {
            try {
                const resOrg = yield call(createOrg, payload);

                if (typeof(resOrg.error_code) !== 'undefined' && resOrg.error_code) {
                    Modal.warning({
                        title:intl.formatMessage(messages.createOrgFail),
                        content: resOrg.msg
                    });
                    return;
                }

                if (payload.organization.type === 'peer') {
                    //查询用户信息
                    const resUsers = yield call(query);
                    const targetUser = 'Admin@' + payload.organization.name + '.' + payload.organization.domain;
                    let exist = false;
                    if (typeof(resUsers.users) === 'undefined') {
                        Modal.warning({title:intl.formatMessage(messages.accessUserFail, {name:targetUser})});
                        return;
                    }
                    else {
                        //查看用户是否已经存在
                        for (const user in resUsers.users.result) {
                            if (resUsers.users.result[user].name === targetUser) {
                                exist = true;
                                break;
                            }
                        }

                        //如果账号不存在，则创建此组织账号
                        if (!exist) {
                            const userInfor = {
                                username: targetUser,
                                password: '666666',
                                balance: 0,
                                role: 2,
                                active: 'true'
                            };

                            const response = yield call(createUser, userInfor);
                            if (response.status !== 'OK') {
                                Modal.warning({title:intl.formatMessage(messages.createUserFail)});
                                return;
                            }
                        }
                    }
                }
            }
            catch (e) {
                console.log('orge:', e);
            }
            yield put(
                routerRedux.push({
                    pathname: 'orglist',
                })
            );
        },

        *SearchOrgByName({payload}, {call, put}){
            const response = yield call(searchOrgByName, payload);
            yield put({
                type: 'queryList',
                payload: response,
            });
        },

        *SearchOrgById({payload}, {call, put}){
            const orgInfor = yield call(searchOrgById, payload);
            let networkName = '';

            if (typeof(orgInfor) !== 'undefined'){
                if (orgInfor.organization.blockchain_network_id !== ''){
                    const network = yield call(queryNetwork, orgInfor.organization.blockchain_network_id);

                    networkName = network.blockchain_network.name;
                }
                orgInfor.organization.networkName = networkName;
            }


            yield put({
                type: 'queryList',
                payload: orgInfor,
            });
        },

        *updateorg({ payload }, {call, put }) {
            try {
                // yield call(createOrg, payload);
                const response = updateOrg(payload);
                yield put(
                    routerRedux.push({
                        pathname: 'orglist',
                    })
                );
            }
            catch (e) {
                console.log(e);
            }
            // yield call(payload.callback);
        },

        *DelOrg({payload}, {call, put}){
            const response = yield call(deleteOrg, payload);

            if (typeof(response.error_code) !== 'undefined' && response.error_code) {
                Modal.warning({
                    title:intl.formatMessage(messages.deleteOrgFail),
                    content: resOrg.msg
                });
                return;
            }

            if (payload.orgType === 'peer') {
                const resUsers = yield call(query);
                const orgName = payload.orgName;
                let userId = '';

                //找到将要被删除的组织的管理员账号
                for (const user in resUsers.users.result) {
                    const nameArray = resUsers.users.result[user].name.split('@');
                    if (nameArray.length < 2) {
                        continue;
                    }

                    const name = nameArray[1].split('.')[0];
                    if (name === orgName) {
                        userId = resUsers.users.result[user].id;
                        break;
                    }
                }

                const res = yield call(deleteUser, userId);
                if (res.status !== 'OK') {
                    Modal.warning({
                        title:intl.formatMessage(messages.deleteAccountFail),
                    });
                }
            }

            yield put({type: 'fetch'});
        },
    
        *appendPeer({payload, callback}, {call, put}){
            const response = yield call(appendPeer, payload);
            if (callback) {
                callback(response);
            }
        },
    },

    reducers: {
        queryList(state, action) {
            return {
                ...state,
                organization: action.payload,
            };
        },
        appendList(state, action) {
            return {
                ...state,
                organization: state.list.concat(action.payload),
            };
        },
    },
};
