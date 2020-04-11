import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Card, Button, Icon, List, Tag } from 'antd';
import { routerRedux } from 'dva/router';
import DescriptionList from 'components/DescriptionList';
import Ellipsis from 'components/Ellipsis';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import moment from 'moment';
import styles from './networkdetail.less';
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from "../../utils/utils";

const messages = defineMessages({
    pageTitle: {
        id: 'Network.DetailPageTitle',
        defaultMessage: 'Network Detail'
    },
    backButton: {
        id: 'Network.DetailBackButton',
        defaultMessage: 'Back'
    },
    description: {
        id: 'Network.DetailDescription',
        defaultMessage: 'Description'
    },
    fabricVersion: {
        id: 'Network.DetailFabricVersion',
        defaultMessage: 'Fabric Version'
    },
    consensus: {
        id: 'Network.DetailConsensus',
        defaultMessage: 'Consensus'
    },
    status: {
        id: 'Network.DetailStatus',
        defaultMessage: 'Status'
    },
    host: {
        id: 'Network.DetailHost',
        defaultMessage: 'Host'
    },
    healthy: {
        id: 'Network.DetailHealthy',
        defaultMessage: 'Healthy'
    },
    healthyNormal: {
        id: 'Network.DetailHealthyNormal',
        defaultMessage: 'Normal'
    },
    healthyFault: {
        id: 'Network.DetailHealthyFault',
        defaultMessage: 'Fault'
    },
    createTime: {
        id: 'Network.DetailCreationTime',
        defaultMessage: 'Creation Time'
    },
    listName: {
        id: 'Network.DetailListName',
        defaultMessage: 'Organizations List'
    },
    colName: {
        id: 'Network.DetailColName',
        defaultMessage: 'Organization Name'
    },
    colDescription: {
        id: 'Network.DetailColDesc',
        defaultMessage: 'Description'
    },
    colType: {
        id: 'Network.DetailColType',
        defaultMessage: 'Type'
    },
    networkStatusTitle: {
        id: 'Network.DetailStatusTitle',
        defaultMessage: 'Network health monitoring'
    },
});
const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();
const { Description } = DescriptionList;
const ButtonGroup = Button.Group;

@connect(({ networklist }) => ({
    networklist
}))

export default class NetworkDetail extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            healthyLoop: 0,
            ip: '',
            orgName: '',
            orgInfo: {}
        }
    }
    
    componentDidMount() {
        clearInterval(this.state.healthyLoop);
        const { dispatch, location } = this.props;
        const search = new URLSearchParams(location.search);
        const netId = search.get('id');
        
        dispatch({
            type: 'networklist/fetchNetworkDetail',
            payload: {netId:netId}
        });
        dispatch({
            type: 'networklist/fetchNetworkHealthy',
            payload: {netId:netId}
        });
        
        const healthyLoop = setInterval(() => {
            dispatch({
                type: 'networklist/fetchNetworkHealthy',
                payload: {netId:netId}
            });
        }, 10000);
        this.setState({
            healthyLoop: healthyLoop
        });
    }
    
    
    clickCancel = () => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'networklist',
            })
        );
    };
    
    componentWillUnmount() {
        clearInterval(this.state.healthyLoop);
    }
    
    render() {
        const {
            networklist : {blockchain_networks, orgInfo, healthyList},
        } = this.props;
        
        this.setState({orgInfo: orgInfo});
        
        const curnetwork = typeof(blockchain_networks) === 'undefined' ? {
            consensus_type: '',
            create_ts: '',
            description: '',
            fabric_version: '',
            healthy: '',
            id: '',
            name: '',
            status: '',
            hostname: '',
            list: []
        } : blockchain_networks;
        
        const orgs = typeof(curnetwork.list) === 'undefined' ? [] : curnetwork.list;
        const orgNames = orgs.map(org => org.name).join(',') || '';
        
        return (
            <PageHeaderLayout
                title={intl.formatMessage(messages.pageTitle)}
                content=''
                logo={<Icon type="cluster" style={{fontSize: 30, color: '#722ed1'}} />}
            >
                <Card bordered={false}>
                    <DescriptionList size="large" style={{ marginBottom: 32 }}>
                        <ButtonGroup>
                            <Button onClick={this.clickCancel}><Icon type="left" />{intl.formatMessage(messages.backButton)}</Button>
                        </ButtonGroup>
                    </DescriptionList>
                    
                    <DescriptionList size="large" title={curnetwork.name} style={{ marginBottom: 32 }}>
                        <Description term={'id'}>{curnetwork.id}</Description>
                        <Description term={intl.formatMessage(messages.description)}>{curnetwork.description}</Description>
                        <Description term={intl.formatMessage(messages.fabricVersion)}>{curnetwork.fabric_version}</Description>
                        <Description term={intl.formatMessage(messages.consensus)}>{curnetwork.consensus_type}</Description>
                        <Description term={intl.formatMessage(messages.status)}>{curnetwork.status}</Description>
                        <Description term={intl.formatMessage(messages.host)}>{curnetwork.hostname}</Description>
                        <Description term={intl.formatMessage(messages.healthy)}>{curnetwork.healthy ? intl.formatMessage(messages.healthyNormal) : intl.formatMessage(messages.healthyFault)}</Description>
                        <Description term={intl.formatMessage(messages.createTime)}>{moment(curnetwork.create_ts).format('YYYY-MM-DD HH:mm:ss')}</Description>
                        <Description term={intl.formatMessage(messages.listName)} style={{wordBreak: 'break-word'}}>{orgNames}</Description>
                    </DescriptionList>
                </Card>
                <Card bordered={false} title={intl.formatMessage(messages.networkStatusTitle)} style={{marginTop: 20}}>
                    <div className={styles.cardList}>
                        <List
                            rowKey="id"
                            grid={{ gutter: 24, lg: 3, md: 2, sm: 1, xs: 1 }}
                            dataSource={[...healthyList]}
                            renderItem={item =>
                                (
                                    <List.Item key={item.org_name}>
                                        <Card className={styles.card}>
                                            <Card.Meta
                                                title={<a>{item.org_name}</a>}
                                                description={
                                                    item.serviceList.map(svc => {
                                                        return (
                                                            <Ellipsis className={styles.item}>
                                                                {svc.service_name}
                                                                <Tag className={styles.healthy} color={svc.healthy?"green":"red"}>
                                                                    {svc.healthy?intl.formatMessage(messages.healthyNormal) : intl.formatMessage(messages.healthyFault)}
                                                                </Tag>
                                                            </Ellipsis>
                                                        )
                                                    })
                                                }
                                            />
                                        </Card>
                                    </List.Item>
                                )
                            }
                        />
                    </div>
                </Card>
            </PageHeaderLayout>
        );
    }
}
