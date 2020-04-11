import React, { Component, Fragment } from 'react';
import pathToRegexp from 'path-to-regexp';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Icon,Card,Form} from 'antd';
import moment from 'moment';
import DescriptionList from '../../components/DescriptionList';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './ChannelDetail.less';
import Chaincode from './instantList';
import PeerList from './peerlist'
import OrgList from './orglist'
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from "../../utils/utils";

const messages = defineMessages({
    pageTitle: {
        id: 'Channel.Detail.pageTitle',
        defaultMessage: 'Channel Detail',
    },
    chName: {
        id: 'Channel.Detail.chName',
        defaultMessage: 'Name',
    },
    chId: {
        id: 'Channel.Detail.chId',
        defaultMessage: 'ID',
    },
    network: {
        id: 'Channel.Detail.network',
        defaultMessage: 'Network',
    },
    order: {
        id: 'Channel.Detail.order',
        defaultMessage: 'Orderer Node',
    },
    creationTime: {
        id: 'Channel.Detail.creationTime',
        defaultMessage: 'Creation Time',
    },
    creator: {
        id: 'Channel.Detail.creator',
        defaultMessage: 'Creator',
    },
    tabOrgList: {
        id: 'Channel.Detail.tabOrgList',
        defaultMessage: 'Organization List',
    },
    peerList: {
        id: 'Channel.Detail.peerList',
        defaultMessage: 'Node List',
    },
    instantList: {
        id: 'Channel.Detail.instantList',
        defaultMessage: 'Instantiated Chain Code List',
    },
});

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

const { Description } = DescriptionList;

const tabList = [
    {
        key: 'org',
        tab: intl.formatMessage(messages.tabOrgList),
    },
    {
        key: 'peer',
        tab: intl.formatMessage(messages.peerList),
    },
    {
        key: 'chaincode',
        tab: intl.formatMessage(messages.instantList),
    },
];

@connect(({ ChannelInstant,InstantChainCode, ChannelDetail, ChannelList, loading }) => ({
    ChannelInstant,
    ChannelDetail,
    InstantChainCode,
    ChannelList,
    loadingPeers:  loading.effects['ChannelDetail/fetch'],
    loadingInfo: loading.models.ChannelDetail,
}))
@Form.create()
export default class ChannelDetail extends Component {
    constructor(props) {
        super(props);
    }
    state = {
        operationKey: 'org',
        stepDirection: 'horizontal',
        operateStep: 0,
    };

    componentWillMount() {
        const location = this.props.location || this.context.location;
        const search = new URLSearchParams(location.search);
        const channelId = search.get('id');
        this.props.dispatch({
            type: 'ChannelDetail/fetch',
            payload:{
                id:channelId,
            },
        });
    }


    onOperationTabChange = key => {
        this.setState({
            operationKey: key,
            operateStep: 0,
        });
    };

    render() {
        const {
            ChannelDetail:{ChannelDetail},
            loadingInfo,
            loadingPeers,
        } = this.props;

         const peers=Array.isArray(ChannelDetail.peers) ? ChannelDetail.peers : [];
         const orgs=Array.isArray(ChannelDetail.org) ? ChannelDetail.org : [];

         const location = this.props.location || this.context.location;
         const search = new URLSearchParams(location.search);
         const channelId = search.get('id');

        const OrgProps = {
            orgs,
            loadingInfo,
            channelId
        };


        const peerProps = {
            channelId,
            peers,
            loadingPeers,
        };


        const instantList = {
            channelId,
            loadingInfo,

        };

        const contentList = {
            peer: (
                <PeerList {...peerProps} />
            ),
            org: (
                <OrgList {...OrgProps} />
            ),
            chaincode: (
                <Chaincode {...instantList}/>
            ),
        };

        const description = (
               <DescriptionList className={styles.headerList}  col="2">
                <Description term={intl.formatMessage(messages.chName)}>{ChannelDetail.name }</Description>
                <Description term={intl.formatMessage(messages.chId)}>{ChannelDetail.id} </Description>
                <Description term={intl.formatMessage(messages.network)}> {ChannelDetail.net_name}</Description>
                <Description term={intl.formatMessage(messages.order)}> {ChannelDetail.orderer_url}</Description>
                <Description term={intl.formatMessage(messages.creationTime)}>{moment(ChannelDetail.create_ts).format('YYYY-MM-DD HH:mm:ss')} </Description>
                <Description term={intl.formatMessage(messages.creator)}> {ChannelDetail.creator_name}</Description>

            </DescriptionList>
        );

        return (
            <PageHeaderLayout
                title={intl.formatMessage(messages.pageTitle)}
                logo={<Icon type="share-alt" style={{fontSize: 30, color: '#722ed1'}} />}
                loading={loadingInfo}
                content={description}
                tabList={tabList}
                tabActiveKey={this.state.operationKey}
                onTabChange={this.onOperationTabChange}
            >
                <Card bordered={false}>
                    {contentList[this.state.operationKey]}
                </Card>
            </PageHeaderLayout>
        );
    }
}
