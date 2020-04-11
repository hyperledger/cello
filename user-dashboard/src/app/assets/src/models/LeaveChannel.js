import { querySignInfo, agree, applyForLeave } from '../services/LeaveChannel';
import { queryOrgList } from '../services/orgs_api';
import { queryOneChannel } from '../services/channel_api';
export default {
    namespace: 'LeaveChannel',

    state: {
        OrgListApplied: [],
        iApplied: []
    },

    effects: {
        *fetch({ payload }, { call, put }) {
            const resOrgs = yield call(queryOrgList, payload);

            const resChannel = yield call(queryOneChannel, payload.channelId);

            const resSignInfo = yield call(querySignInfo, payload.channelId);

            const OrgListApplied = [];

            const CurOrg = window.username.split('@')[1];
            let CurOrgId = '';
            let iApplied = false;

            if (typeof(resChannel.channel.name) !== 'undefined') {
                resOrgs.organizations.map( org => {
                    if (CurOrg === (org.name + '.' + org.domain)) {
                        CurOrgId = org.id;
                    }
                });
                for (let i = 0;i < resOrgs.organizations.length;i++) {
                    //找到在当前channel的组织
                    if (-1 !== resChannel.channel.peer_orgs.indexOf(resOrgs.organizations[i].id)
                    ) {
                        //当前组织是否已申请退出
                        let bApplied = false;
                        resSignInfo.signlist.map( signOrg => {
                            if (resOrgs.organizations[i].id === signOrg.orgid) {
                                resOrgs.organizations[i].signinfo = signOrg.signinfo;
                                bApplied = true;
                            }
                        });
                        if (bApplied) {
                            //申请退出的组织是不是当前用户所在组织
                            if (CurOrg === (resOrgs.organizations[i].name + '.' + resOrgs.organizations[i].domain)) {
                                iApplied = true;
                            }
                            if (-1 !== resOrgs.organizations[i].signinfo.indexOf(CurOrgId)) {
                                resOrgs.organizations[i].signed = 1;
                            }
                            else {
                                resOrgs.organizations[i].signed = 0;
                            }
                
                            OrgListApplied.push(resOrgs.organizations[i]);
                        }
                    }
                }
            }
            else {      //没有获取到通道信息，当前用户所在组织可能已经不在通道内，则不允许申请退出当前通道
                iApplied = true;
            }
            yield put({
                type: 'save',
                payload: {
                    OrgListApplied,
                    iApplied
                },
            });
        },
        *apply({ payload, callback }, { call, put }) {
            const response = yield call(applyForLeave, payload);

            payload.dispatch({
                type: 'LeaveChannel/fetch',
                payload: {
                    channelId: payload.channelId
                }
            });
            if (callback) callback();
        },
        *agree({ payload, callback }, { call, put }) {
            const response = yield call(agree, payload);

            payload.dispatch({
                type: 'LeaveChannel/fetch',
                payload: {
                    channelId: payload.channelId
                }
            });
            if (callback) callback();
        }
    },

    reducers: {
        save(state, action) {
            return {
                ...state,
                OrgListApplied: action.payload.OrgListApplied,
                iApplied: action.payload.iApplied
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
