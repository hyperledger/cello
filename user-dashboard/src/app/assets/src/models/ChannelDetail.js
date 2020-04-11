import {queryChannelPeers,addChannelDetail, removeChannelDetail, changeRole} from '../services/peerList_api';
import {createOrg, queryOrgList} from '../services/orgs_api';
import {queryNetworks} from "../services/network_api";
import {queryOneChannel} from "../services/channel_api";
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from "../utils/utils";

const messages = defineMessages({
    endorser: {
        id: 'Channel.Detail.NodeList.endorser',
        defaultMessage: 'Endorser',
    },
});

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

export default {
    namespace: 'ChannelDetail',
    
    state: {
        ChannelDetail: [],
    },
    
    
    effects: {
        *fetch({ payload }, { call, put }) {
            const ClPeer = yield call(queryChannelPeers, payload);
            const peerlists=ClPeer.peers;    //  peers数组
            const peerslength=peerlists.length;
            
            const channelId=payload.id;  //  从router层传过来的通道ID值
            const ChannelList = yield call(queryOneChannel, channelId);
            const channel=ChannelList.channel;      // 获取到对应通道ID的通道
            const networkid=channel.blockchain_network_id;
            
            //通过network ID获取network Name
            const mapNetResponse = yield call(queryNetworks, networkid);
            const net_name = mapNetResponse.blockchain_network.name;
            channel.net_name = net_name;
            
            // peer列表
            const network12=networkid.substring(0,12);
            const peers=[];
            peerlists.map((item,index) =>{
                let roles = [];
                if (item.roles.chaincodeQuery) {
                    roles.push('chaincodeQuery');
                }
                if (item.roles.endorsingPeer) {
                    roles.push('endorsingPeer');
                }
                if (item.roles.ledgerQuery) {
                    roles.push('ledgerQuery');
                }
                
                peers.push(
                    Object.assign({},item,{
                        role:roles.join(' ,'),
                    })
                )
            });
            for(let i=0;i<peerslength;i++){
                peers[i].docker=network12+'_'+peerlists[i].name;   // docker名称
            }
            channel.peers = peers;
            
            //组织列表
            const response = yield call(queryOrgList, payload);
            const orgList=response.organizations;
            //   const orgName=window.username;
            
            var orgOption=[];
            for(let i=0;i<orgList.length;i++){
                if(orgList[i].blockchain_network_id===networkid){  // 筛选出网络ID匹配的组织
                    orgOption.push(orgList[i]);
                }
            }
            
            const org = [];
            for(let i=0;i<orgOption.length;i++){
                for(let j=0;j<channel.peer_orgs.length;j++){
                    if(orgOption[i].id === channel.peer_orgs[j] ) {  // 组织ID等于通道peer组织字段的值
                        org.push({                            // 单独创建一个数组来显示org列表
                            org_name: orgOption[i].name,
                            org_id:   orgOption[i].id,
                        });
                    }
                }
            }
            channel.org =org;
            
            
            const ChannelDetail= channel;
            
            
            yield put({
                type: 'save',
                payload: ChannelDetail,
            });
        },
        *changeRole({ payload }, { call, put }) {
            const response = yield call(changeRole, payload.info);
            
            payload.dispatch({
                type: 'ChannelDetail/fetch',
                payload:{
                    id: payload.info.channel_id,
                },
            });
        }
        
        /*    *add({ payload, callback }, { call, put }) {
                const response = yield call(addChannelDetail, payload);
                yield put({
                    type: 'save',
                    payload: response,
                });
                if (callback) callback();
            },
            *remove({ payload, callback }, { call, put }) {
                const response = yield call(removeChannelDetail, payload);
                yield put({
                    type: 'save',
                    payload: response,
                });
                if (callback) callback();
            }, */
    },
    
    reducers: {
        save(state, action) {
            return {
                ...state,
                ChannelDetail: action.payload,
            };
        },
    },
};
