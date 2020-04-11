import { querySignInfo, agree, addOrgExpand } from '../services/OrgExpand';
import { queryOrgList } from '../services/orgs_api';
import { queryOneChannel } from '../services/channel_api';
import { routerRedux } from 'dva/router';
import { stringify } from "qs";
export default {
    namespace: 'OrgExpand',

    state: {
        OrgList: [],
        OrgListInvited: [],
    },

    effects: {
        *fetch({ payload }, { call, put }) {
            const resOrgs = yield call(queryOrgList, payload);

            const resChannel = yield call(queryOneChannel, payload.channelId);

            const resSignInfo = yield call(querySignInfo, payload.channelId);

            const OrgList = [];
            const OrgListInvited = [];

            const CurOrg = window.username.split('@')[1];
            let CurOrgId = '';

            resOrgs.organizations.map( org => {
                if (CurOrg === (org.name + '.' + org.domain)) {
                    CurOrgId = org.id;
                }
            });
            for (let i = 0;i < resOrgs.organizations.length;i++) {
                if (resOrgs.organizations[i].type === 'peer') {
                    //找到在同一个网络，但不在当前channel的组织
                    if ((resChannel.channel.blockchain_network_id === resOrgs.organizations[i].blockchain_network_id)
                        && (-1 === resChannel.channel.peer_orgs.indexOf(resOrgs.organizations[i].id))
                    ) {
                        //当前组织是否已被邀请
                        let bInvited = false;
                        resSignInfo.signlist.map( signOrg => {
                            if (resOrgs.organizations[i].id === signOrg.orgid) {
                                resOrgs.organizations[i].signinfo = signOrg.signinfo;
                                bInvited = true;
                            }
                        });
                        if (bInvited) {
                            //被邀请的组织不是当前用户所在组织
                            if (CurOrg !== (resOrgs.organizations[i].name + '.' + resOrgs.organizations[i].domain)) {
                                if (-1 !== resOrgs.organizations[i].signinfo.indexOf(CurOrgId)) {
                                    resOrgs.organizations[i].signed = 1;
                                }
                                else {
                                    resOrgs.organizations[i].signed = 0;
                                }

                                OrgListInvited.push(resOrgs.organizations[i]);
                            }
                        }
                        else {
                            OrgList.push(resOrgs.organizations[i]);
                        }
                    }
                }
            }
            yield put({
                type: 'save',
                payload: {
                    OrgList,
                    OrgListInvited
                },
            });
        },
        *add({ payload, callback }, { call, put }) {
            const response = yield call(addOrgExpand, payload);

            payload.dispatch({
                type: 'OrgExpand/fetch',
                payload: {
                    channelId: payload.channelId
                }
            });
            if (callback) callback();
        },
        *agree({ payload, callback }, { call, put }) {
            const response = yield call(agree, payload);

            payload.dispatch({
                type: 'OrgExpand/fetch',
                payload: {
                    channelId: payload.channelId
                }
            });
            if (callback) callback();
        },
    },

    reducers: {
        save(state, action) {
            return {
                ...state,
                OrgList:action.payload.OrgList,
                OrgListInvited: action.payload.OrgListInvited
            };
        },
        invite(state, action) {
            return {
                ...state,
                inviteRes: action.payload
            }
        }
    },
};
