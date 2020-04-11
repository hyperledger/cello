import { routerRedux } from 'dva/router';
import { queryOrgList, createOrg, searchOrgByName, deleteOrg, searchOrgById, updateOrg } from '../services/orgs_api';

export default {
    namespace: 'organization',

    state: {
        organization: [],
    },

    effects: {
        *fetch({ payload }, { call, put }) {
            const response = yield call(queryOrgList, payload);   // 获取组织列表
            const orgList=response.organizations;

            const orgName=window.username;   //8081用户登录名,如 admin@org1.cello.com
            const org=orgName.split('@');   //拆分成admin 和 org1.cello.com
            const orgData=org[1].split('.'); // 再拆分得到[org1, cello, com]
            const orgNeed=orgData[0];

            var netID;
            for(let i=0;i<orgList.length;i++){
                if(orgList[i].name===orgNeed){       // 用org1去组织列表中筛选出对应的网络ID
                    netID=orgList[i].blockchain_network_id;
                }
            }

            var orgOption=[];
            if (netID===""){    // 也存在创建的组织还没加进网络，但可以登录的情况，此时网络id为空
                orgOption.push([]);  //直接返回空值
            }
            else {
                for(let i=0;i<orgList.length;i++){
                    if(orgList[i].blockchain_network_id===netID){
                        orgOption.push(orgList[i]);         //将同一网络ID的组织筛选出来作为选项
                    }
                }
            }
            const orgInfo = {organizations: orgOption};  //组成json格式的类型传给router层

            yield put({
                type: 'queryList',
                payload: orgInfo,
            });

        },

        *createorg({ payload }, { call, put }) {
            try {
                //yield call(createOrg, payload);
                const response = createOrg(payload);
                yield put(
                    routerRedux.push({
                        pathname: 'orglist',
                    })
                );
            }
            catch (e) {
                console.log(e);
            }
        },

        *SearchOrgByName({payload}, {call, put}){
            const response = yield call(searchOrgByName, payload);
            yield put({
                type: 'queryList',
                payload: response,
            });
        },

        *SearchOrgById({payload}, {call, put}){
            const response = yield call(searchOrgById, payload);
            yield put({
                type: 'queryList',
                payload: response,
            });
        },

        *updateorg({ payload }, { call, put }) {
            try {
                //yield call(createOrg, payload);
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
            //yield call(payload.callback);
        },

        *DelOrg({payload}, {call, put}){
            yield call(deleteOrg, payload);
            yield put({type: 'fetch'});
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
