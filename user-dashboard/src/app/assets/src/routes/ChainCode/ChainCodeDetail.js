
import React, { PureComponent, Fragment } from 'react';
import { routerRedux } from 'dva/router';
import {
    Card,
    Button,
    Form,
    Icon,
    Table,
    Row,
    Col,
} from 'antd';
import moment from 'moment';
import { connect } from 'dva';
import DescriptionList from '../../components/DescriptionList';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import Ellipsis from '../../components/Ellipsis';
import styles from './ChainCodeList.less';
import {defineMessages, IntlProvider} from "react-intl";
import {getLocale} from "../../utils/utils";
const { Description } = DescriptionList;



const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

const messages = defineMessages({
    chainCodeDetails: {
        id: 'ChainCode.Details.ChainCodeDetails',
        defaultMessage: 'ChainCode details',
    },
    name: {
        id: 'ChainCode.Details.Name',
        defaultMessage: 'Name',
    },
    network: {
        id: 'ChainCode.Details.Network',
        defaultMessage: 'Block chain network',
    },
    uploadTime: {
        id: 'ChainCode.Details.UploadChainCodeTime',
        defaultMessage: 'Upload ChainCode Time',
    },
    number: {
        id: 'ChainCode.Details.NumberOfInstalledChainCodes',
        defaultMessage: 'Number of Installed ChainCodes',
    },
    creator: {
        id: 'ChainCode.Details.Creator',
        defaultMessage: 'Creator',
    },
    nodeLists: {
        id: 'ChainCode.Details.NodeLists',
        defaultMessage: 'Node lists',
    },
    installedNodes: {
        id: 'ChainCode.Details.InstalledNodes',
        defaultMessage: 'Installed nodes',
    },
    firstInstallationTime: {
        id: 'ChainCode.Details.FirstInstallationTime',
        defaultMessage: 'First Installation Time',
    },
    channelLists: {
        id: 'ChainCode.Details.ChannelLists',
        defaultMessage: 'Channel lists',
    },
    channelNames: {
        id: 'ChainCode.Details.ChannelNames',
        defaultMessage: 'Channel names',
    },
    back: {
        id: 'ChainCode.Details.Back',
        defaultMessage: 'Back',
    },
});

@connect(({ ChainCodeDetail,loading }) => ({
    ChainCodeDetail,
    loading: loading.models.ChainCodeDetail,
}))
@Form.create()
export default class ChainCodeDetail extends PureComponent {


    componentWillMount() {
        const { dispatch } = this.props;
        const location = this.props.location || this.context.location;
        const search = new URLSearchParams(location.search);
        const chainCodeId = search.get('id');
        dispatch({
            type: 'ChainCodeDetail/fetchNet',
            payload:{
                id:chainCodeId,
            },
        });
    }

    clickCancel = () => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'ChainCodeList',
            })
        );
    };


    render() {
        const {
            ChainCodeDetail:{chaincodes},
            loading,
        } = this.props;

        const PeerColumns = [
            {
                title: intl.formatMessage(messages.installedNodes),
                dataIndex: 'peer_name',
                key: 'peer_name',

            },
            {
                title: intl.formatMessage(messages.firstInstallationTime),
                dataIndex: 'install_ts',
                key: 'install_ts',
                render: val => <Ellipsis lines={1}>{moment(val).format('YYYY-MM-DD HH:mm:ss')}</Ellipsis>,
            },
        ];

        const ChannleColumns = [
            {
                title: intl.formatMessage(messages.channelNames),
                dataIndex: 'channelName',
                key: 'channelName',
            },

        ];

        const paginationProps = {
            showSizeChanger: true,
        };


       const ccpeers = Array.isArray(chaincodes.peers) ? chaincodes.peers: [];

        const description = (
            <DescriptionList className={styles.headerList}  col="1">
                <Description   term={'ID'}> {chaincodes.id}</Description>
                <Description   term={intl.formatMessage(messages.name)}> {chaincodes.name}</Description>
                <Description   term={intl.formatMessage(messages.network)}>{chaincodes.network_name} </Description>
                <Description   term={intl.formatMessage(messages.uploadTime)}>{moment(chaincodes.create_ts).format('YYYY-MM-DD HH:mm:ss')} </Description>
                <Description   term={intl.formatMessage(messages.number)}>{chaincodes.install_times} </Description>
                <Description   term={intl.formatMessage(messages.creator)}>{chaincodes.creator_name} </Description>
            </DescriptionList>
        );

        return (
            <PageHeaderLayout
                title={intl.formatMessage(messages.chainCodeDetails)}
                logo={<Icon type="link" style={{fontSize: 30, color: '#722ed1'}} />}
                content={description}
            >

                <Row gutter={24}>
                    <Col xl={12} lg={24} md={24} sm={24} xs={24}>
                        <Card
                            bordered={false}
                            title={intl.formatMessage(messages.nodeLists)}
                        >
                            <div className={styles.standardTable}>
                                <Table
                                    className={styles.table}
                                    loading={loading}
                                    columns={PeerColumns}
                                    dataSource={ccpeers}
                                    pagination={paginationProps}
                                />
                            </div>
                        </Card>
                    </Col>
                    <Col xl={12} lg={24} md={24} sm={24} xs={24}>
                        <Card
                            bordered={false}
                            title={intl.formatMessage(messages.channelLists)}
                        >
                            <div className={styles.standardTable}>
                                <Table

                                    className={styles.table}
                                    loading={loading}
                                    columns={ChannleColumns}
                                    dataSource={chaincodes.channelName}
                                    pagination={paginationProps}
                                />
                            </div>
                        </Card>
                    </Col>
                </Row>
                <div>
                    <Button icon="rollback" type="primary" style={{ marginTop: 20 }} onClick={this.clickCancel}>
                        {intl.formatMessage(messages.back)}
                    </Button>
                </div>
            </PageHeaderLayout>
        );
    }
}
