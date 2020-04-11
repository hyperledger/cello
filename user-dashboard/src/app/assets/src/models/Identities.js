import {queryOneChannel} from "../services/channel_api";
import {queryOneOrg} from "../services/orgs_api";


export default {
    namespace: 'Identities',

    state: {
        OrgRole: [],
    },


    effects: {
        * fetchOrgMsp({payload}, {call, put}) {
            const channelID = payload.channelId;
            const ChannelList = yield call(queryOneChannel, channelID);  //  从router层传过来的通道ID值
            const channel = ChannelList.channel;      // 获取到对应通道ID的通道

            const orgIdList = channel.peer_orgs;   // 组织的数组

            var identities = [];
            for (let t = 0; t < orgIdList.length; t++) {
                const orgId = orgIdList[t];
                const OrgInfo = yield call(queryOneOrg, orgId);
                const orgName = OrgInfo.organization.name;
                const orgNameUpper = orgName.replace(orgName.charAt(0), orgName.charAt(0).toUpperCase());
                const orgMspId = orgNameUpper + "MSP";
                const role = {name: "member", mspId: orgMspId};

                identities.push({role: role});

            }

            yield put({
                type: 'save',
                payload: identities,
            });
        },
    },

        reducers: {
            save(state, action) {
                return {
                    ...state,
                    OrgRole: action.payload,
                };
            },
        },

};
