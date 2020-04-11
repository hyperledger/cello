import { routerRedux } from 'dva/router';
import { queryOrgUser, ResetAdminPassword, queryOneUser, updateUserInfo, createOrgUser,updateOrgUser,reEnrollOrgUser,removeOrgUser,GetAffiliation,CreateAffiliation,UpdateAffiliation,resetOrgUserPassword, SetSSOUser } from '../services/orguser_api';
import {queryNetworks} from "../services/network_api";
import {message} from "antd/lib/index";
import {defineMessages, IntlProvider} from "react-intl";
import {getLocale} from "../utils/utils";

const messages = defineMessages({
    administrator: {
        id: 'User.NewUser.Administrator',
        defaultMessage: 'Administrator',
    },
    operator: {
        id: 'User.NewUser.Operator',
        defaultMessage: 'Operator',
    },
    updateSuccess: {
        id: 'User.UpdateInfo.Success',
        defaultMessage: 'Update user information success.',
    },
    updateFail: {
        id: 'User.UpdateInfo.Fail',
        defaultMessage: 'Update user information Fail.',
    },
    getUserFail: {
        id: 'User.GetUser.Fail',
        defaultMessage: 'Get user information Fail.',
    }
});
const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

export default {
    namespace: 'OrgUserList',
    
    state: {
        orgusers: [],
        getAffili:[],
        postAffili:[],
        currentUser:[]
    },
    
    effects: {
        * fetch({payload}, {call, put}) {
            const orgusers=[];
            const response = yield call(queryOrgUser, payload);
            if (typeof(response) !== 'undefined') {
                const orgUsers = response.orgusers;
                if (orgUsers.length > 0) {
                    const networkId = orgUsers[0].network_id;
                    const mapNetResponse = yield call(queryNetworks, networkId);
                    const net_name = mapNetResponse.blockchain_network.name;
                    const orgUserResponse = orgUsers;   //用户列表
                    orgUserResponse.map((item, index) => {
                        if (item.roles === 'org_admin') {
                            item.roles = intl.formatMessage(messages.administrator);
                        }
                        else {
                            item.roles = intl.formatMessage(messages.operator);
                        }
                        
                        orgusers.push(
                            Object.assign({}, item, {network_name: net_name})      // 增加网络名称到列表字段中
                        )
                    });
                    
                }
                yield put({
                    type: 'save',
                    payload: orgusers,
                });
            }
        },
        
        
        *createOrgUser({payload}, {call, put}) {
            /* const queryOrg = yield call(GetAffiliation, '');
   
             if(queryOrg.affiliation.indexOf(payload.orguser.affiliation)===-1){
                 const response = yield call(createAffiliation, {name:payload.orguser.affiliation});
                 console.log('response');
                 console.log(response);
             } */
            const response = yield call(createOrgUser, payload);
            //    if (response === 'Ok') {
            yield put(
                routerRedux.push({
                    pathname: 'OrgUserList',
                })
            );
            //    }
        },
        
        *updateOrgUser({payload}, {call, put}) {
            const updateState = yield call(updateOrgUser, payload);
            
            payload.dispatch({
                type: 'OrgUserList/fetch',
            });
        },
        
        * reEnrollOrgUser({payload}, {call, put}) {
            const response = yield call(reEnrollOrgUser, payload);
            message.success(payload.msg);
            yield put({
                type: 'fetch',
            });
        },
        
        *resetOrgUserPassword({payload,callback}, {call, put}){
            const response = yield call(resetOrgUserPassword, payload);
            callback(response);
            console.log("response:",response);
        },
        
        
        * removeOrgUser({payload}, {call, put}) {
            const response = yield call(removeOrgUser, payload);
            yield put({
                type: 'fetch',
            });
        },
        
        * getAffiliation({payload}, {call, put}) {
            const response = yield call(GetAffiliation, payload);
            const affiliation=response.affiliation;
            
            const Aff=[];
            for(let i=0;i<affiliation.length;i++){
                if(affiliation[i]!==''){
                    Aff.push(affiliation[i]);
                }
            }
            
            yield put({
                type: 'getAffili',
                payload: Aff,
            });
            
        },
        
        * createAffiliation({payload}, {call, put}) {
            const queryOrg = yield call(GetAffiliation, '');
            
            if(queryOrg.affiliation.indexOf(payload.AffData)===-1){
                const response = yield call(CreateAffiliation, {name:payload.AffData});
            }
            const response = yield call(GetAffiliation, payload);
            const affiliation=response.affiliation;
            
            const Aff=[];
            for(let i=0;i<affiliation.length;i++){
                if(affiliation[i]!==''){
                    Aff.push(affiliation[i]);
                }
            }
            
            yield put({
                type: 'getAffili',
                payload: Aff,
            });
            
        },
        
        * updateAffiliation({payload}, {call, put}) {
            
            const UpdateResponse = yield call(UpdateAffiliation, payload);
            const response = yield call(GetAffiliation, payload);
            const affiliation=response.affiliation;
            const Aff=[];
            for(let i=0;i<affiliation.length;i++){
                if(affiliation[i]!==''){
                    Aff.push(affiliation[i]);
                }
            }
            
            yield put({
                type: 'getAffili',
                payload: Aff,
            });
        },
        *getUser({payload}, {call, put}) {
            const user = yield call(queryOneUser, payload);
            
            if (!user.success) {
                message.error(intl.formatMessage(messages.getUserFail));
                return;
            }
            yield put({
                type: 'saveUser',
                payload: user.orguser
            })
        },
        *updateUserInfo({payload}, {call, put}) {
            const res = yield call(updateUserInfo, payload);
            
            if (!res.success) {
                message.error(intl.formatMessage(messages.updateFail));
            }
            else {
                message.success(intl.formatMessage(messages.updateSuccess));
            }
            
            payload.dispatch({
                type: 'OrgUserList/getUser',
                payload: {
                    username: window.username
                }
            });
        },
        *ResetAdminPassword({payload, callback}, {call, put}) {
            const res = yield call(ResetAdminPassword, payload);
            callback(res);
        },
        *SetSSOUser({payload, callback}, {call}) {
            const res = yield call(SetSSOUser, payload);
            
            callback(res);
        }
    },
    
    reducers: {
        save(state, action) {
            return {
                ...state,
                orgusers: action.payload,
            };
        },
        getAffili(state,action){
            return{
                ...state,
                getAffili:action.payload,
            }
        },
        saveUser(state, action) {
            return {
                ...state,
                currentUser: action.payload
            }
        }
    },
    
};
