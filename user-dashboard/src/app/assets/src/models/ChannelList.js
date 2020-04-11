import { routerRedux } from 'dva/router';
import { queryChannels,queryOneChannel, removeChannel, createChannel } from '../services/channel_api';
import { queryNetworks } from '../services/network_api';
import { queryChannelPeers } from '../services/peerList_api';
import { message } from 'antd';
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from "../utils/utils";

const messages = defineMessages({
    creating: {
        id: 'Channel.Create.Creating',
        defaultMessage: 'Creating this channel...',
    },
    creatingOk: {
        id: 'Channel.Create.CreateOk',
        defaultMessage: 'Channel creation successful',
    },
    creatingFail: {
        id: 'Channel.Create.CreateFail',
        defaultMessage: 'Channel creation failed',
    },
});

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

export default {
    namespace: 'ChannelList',

    state: {
        channels: [],
    },

    effects: {
        * fetch({payload}, {call, put}) {
            const channels = [];
            const response = yield call(queryChannels, payload);

            if (response.channels.length > 0) {
                for (let i = 0; i < response.channels.length; i++) {
                    const channelId = response.channels[i].id;
                    const channelID = {id: channelId};
                    const channelPeers = yield call(queryChannelPeers, channelID);
                    response.channels[i].peer_num = channelPeers.peers.length;    //通道中添加peer个数字段
                }

                const net_request = response.channels[0].blockchain_network_id;   //得到通道中网络ID
                const mapNetResponse = yield call(queryNetworks, net_request);   //通过网络ID获取到网络名称
                const net_name = mapNetResponse.blockchain_network.name;
                const channelResponse = response.channels;   //通道列表
                channelResponse.map((item, index) => {
                    channels.push(
                        Object.assign({}, item, {net_name: net_name})      // 增加网络名称到通道列表字段中
                    )
                });
            }

            yield put({
                type: 'save',
                payload: channels,
            });
        },

        * oneChannel({payload}, {call, put}) {
            const id = payload.id;
            const channels = yield call(queryOneChannel, id);
            console.log('response');
            console.log(channels);
            yield put({
                type: 'save',
                payload: channels,
            });
        },


        * create({payload}, {call, put}) {
            message.loading(intl.formatMessage(messages.creating), 1.5);
            const response = yield call(createChannel, payload);
            const result=response.channel.success;
            if (result) {
                message.success(intl.formatMessage(messages.creatingOk));
            }
            else{
                message.error(intl.formatMessage(messages.creatingFail));
            }

            yield put(
                routerRedux.push({
                    pathname: 'ChannelList',
                })
            );
        },


        * add({payload, callback}, {call, put}) {
            const response = yield call(addRule, payload);
            yield put({
                type: 'save',
                payload: response,
            });
            if (callback) callback();
        },
    },

    reducers: {
        save(state, action) {
            return {
                ...state,
                channels: action.payload,
            };
        },
        oneClRes(state, action) {
            return {
                ...state,
                channel: action.payload,
            };

        },
    },
}
