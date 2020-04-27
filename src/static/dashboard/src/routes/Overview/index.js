/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { Component, Fragment } from 'react';
import { Row, Col, Card, Radio, Icon } from 'antd';
import { connect } from 'dva';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Pie } from 'components/Charts';
import styles from './index.less';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';

const messages = defineMessages({
    title: {
        host: {
            id: 'Overview.Title.Host',
            defaultMessage: 'Host',
        },
        network: {
            id: 'Overview.Title.Network',
            defaultMessage: 'Network',
        },
        status: {
            id: 'Overview.Title.Status',
            defaultMessage: 'Status',
        },
        type: {
            id: 'Overview.Title.Type',
            defaultMessage: 'Type',
        },
        pageTitle: {
            id: 'Overview.PageTitle',
            defaultMessage: 'System Overview',
        },
        pageDescription: {
            id: 'Overview.PageDescription',
            defaultMessage: 'Information of the hosts,organizations and network',
        },
        organization: {
            id: 'Overview.Organization',
            defaultMessage: 'organization',
        },
        proportionOfOrganization: {
            id: 'Overview.ProportionOfOrganization',
            defaultMessage: 'Proportion of organizations joining the network',
        },
        proportionOfOrgType: {
            id: 'Overview.ProportionOfOrgType',
            defaultMessage: 'Proportion of organization type',
        },
        peerType: {
            id: 'Overview.PeerType',
            defaultMessage: 'Peer type',
        },
        ordererType: {
            id: 'Overview.OrdererType',
            defaultMessage: 'Orderer type',
        },
    },
});

@connect(({ overview, loading }) => ({
    overview,
    loadingNetworkStatus: loading.effects['overview/fetchNetworkStatus'],
    loadingHostStatus: loading.effects['overview/fetchHostStatus'],
    loadingOrgs: loading.effects['overview/fetchOrgs'],
}))
export default class Analysis extends Component {
    state = {
        hostTypeValue: 'type',
        networkTypeValue: 'type',
    };
    componentDidMount() {
        this.props.dispatch({
            type: 'overview/fetchNetworkStatus',
        });
        this.props.dispatch({
            type: 'overview/fetchHostStatus',
        });
        this.props.dispatch({
            type: 'overview/fetchOrgs',
        });
    }
    hostTypeChange = e => {
        this.setState({
            hostTypeValue: e.target.value,
        });
    };
    networkTypeChange = e => {
        this.setState({
            networkTypeValue: e.target.value,
        });
    };
    render() {
        const { overview, loadingNetworkStatus, loadingHostStatus, loadingOrgs } = this.props;
        const { networkStatus, networkTypes, hostStatus, hostTypes, orgInNetwork, orgPercentage } = overview;
        const { networkTypeValue, hostTypeValue } = this.state;
        const orgInNet = Array.isArray(orgInNetwork) ? orgInNetwork : [];

        return (
            <PageHeaderLayout
                title={<FormattedMessage {...messages.title.pageTitle} />}
                logo={<Icon type="home" style={{fontSize: 30, color: '#722ed1'}} />}
                content={<FormattedMessage {...messages.title.pageDescription} />}
            >
                <Fragment>
                    <Row gutter={24}>
                        <Col xl={12} lg={24} md={24} sm={24} xs={24}>
                            <Card
                                loading={loadingHostStatus}
                                className={styles.pieChartCard}
                                bordered={false}
                                title={<FormattedMessage {...messages.title.host} />}
                                bodyStyle={{ padding: 24 }}
                                style={{ marginTop: 24, minHeight: 409 }}
                                extra={
                                    <div className={styles.pieChartCardExtra}>
                                        <div className={styles.pieChartTypeRadio}>
                                            <Radio.Group value={hostTypeValue} onChange={this.hostTypeChange}>
                                                <Radio.Button value="status">
                                                    <FormattedMessage {...messages.title.status} />
                                                </Radio.Button>
                                                <Radio.Button value="type">
                                                    <FormattedMessage {...messages.title.type} />
                                                </Radio.Button>
                                            </Radio.Group>
                                        </div>
                                    </div>
                                }
                            >
                            <h4 style={{ marginTop: 8, marginBottom: 32 }}>
                                <FormattedMessage {...messages.title.host} />{' '}
                                <span className={styles.pieChartSubTitle}>
                                    <FormattedMessage {...messages.title[hostTypeValue]} />
                                </span>
                            </h4>
                            <Pie
                                hasLegend
                                subTitle={
                                    <span className={styles.pieChartSubTitle}>
                                        <FormattedMessage {...messages.title[hostTypeValue]} />
                                    </span>
                                }
                                total={() => (
                                    <span>
                                        {hostTypeValue === 'type'
                                            ? hostTypes.reduce((pre, now) => now.y + pre, 0)
                                            : hostStatus.reduce((pre, now) => now.y + pre, 0)}
                                    </span>
                                )}
                                data={hostTypeValue === 'type' ? hostTypes : hostStatus}
                                height={248}
                                lineWidth={4}
                            />
                            </Card>
                        </Col>
                        <Col xl={12} lg={24} md={24} sm={24} xs={24}>
                            <Card
                                className={styles.pieChartCard}
                                loading={loadingNetworkStatus}
                                bordered={false}
                                title={<FormattedMessage {...messages.title.network} />}
                                bodyStyle={{ padding: 24 }}
                                style={{ marginTop: 24, minHeight: 409 }}
                                extra={
                                    <div className={styles.pieChartCardExtra}>
                                        <div className={styles.pieChartTypeRadio}>
                                            <Radio.Group value={networkTypeValue} onChange={this.networkTypeChange}>
                                                <Radio.Button value="status">
                                                    <FormattedMessage {...messages.title.status} />
                                                </Radio.Button>
                                                <Radio.Button value="type">
                                                    <FormattedMessage {...messages.title.type} />
                                                </Radio.Button>
                                            </Radio.Group>
                                        </div>
                                    </div>
                                }
                            >
                                <h4 style={{ marginTop: 8, marginBottom: 32 }}>
                                    <FormattedMessage {...messages.title.network} />{' '}
                                    <span className={styles.pieChartSubTitle}>
                                        <FormattedMessage {...messages.title[networkTypeValue]} />
                                    </span>
                                </h4>
                                <Pie
                                    hasLegend
                                    subTitle={
                                        <span className={styles.pieChartSubTitle}>
                                            <FormattedMessage {...messages.title[networkTypeValue]} />
                                        </span>
                                    }
                                    total={() => (
                                        <span>
                                            {networkTypeValue === 'type'
                                            ? networkTypes.reduce((pre, now) => now.y + pre, 0)
                                            : networkStatus.reduce((pre, now) => now.y + pre, 0)}
                                        </span>
                                    )}
                                    data={networkTypeValue === 'type' ? networkTypes : networkStatus}
                                    height={248}
                                    lineWidth={4}
                                />
                            </Card>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col >
                            <Card
                                loading={loadingOrgs}
                                className={styles.pieChartCard}
                                bordered={false}
                                title={<FormattedMessage {...messages.title.organization} />}
                                bodyStyle={{ padding: 24 }}
                                style={{ marginTop: 24, minHeight: 409 }}
                            >
                                <Row style={{padding: '20px 0'}} gutter={48} >
                                    <Col span={10} xl={12} lg={24} md={24} sm={24} xs={24}>
                                        <h4>{<FormattedMessage {...messages.title.proportionOfOrganization} />}</h4>
                                        <Pie
                                            hasLegend
                                            subTitle={<FormattedMessage {...messages.title.organization} />}
                                            total={() => (
                                                <span>
                                                    {orgInNet.reduce((pre, now) => now.y + pre, 0)}
                                                </span>
                                            )}
                                            data={orgInNet}
                                            height={200}
                                            lineWidth={1}
                                        />
                                    </Col>
                                    <h4 style={{ marginTop: 8, marginBottom: 32 }}>
                                        {<FormattedMessage {...messages.title.proportionOfOrgType} />}
                                    </h4>
                                    <Col span={5} >
                                        <Pie
                                            animate={false}
                                            color={'#1ac20c'}
                                            percent={orgPercentage.Peer * 100}
                                            subTitle={<FormattedMessage {...messages.title.peerType} />}
                                            total={`${Math.round(orgPercentage.Peer * 100)}%`}
                                            height={150}
                                            lineWidth={1}
                                        />
                                    </Col>
                                    <Col span={5} >
                                        <Pie
                                            animate={false}
                                            color={'#ffbd20'}
                                            percent={orgPercentage.Orderer * 100}
                                            subTitle={<FormattedMessage {...messages.title.ordererType} />}
                                            total={`${Math.round(orgPercentage.Orderer * 100)}%`}
                                            height={150}
                                            lineWidth={1}
                                        />
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    </Row>
                </Fragment>
            </PageHeaderLayout>
        );
    }
}
