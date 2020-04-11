
import React, { PureComponent, Fragment } from 'react';
import { routerRedux } from 'dva/router';
import {
    Card,
    Button,
    Table,
    Badge,
    Modal,
    Checkbox
} from 'antd';
import { connect } from 'dva';
import styles from './ChannelDetail.less';
import {stringify} from "qs";
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from "../../utils/utils";

const messages = defineMessages({
    pageTitle: {
        id: 'Channel.Detail.NodeList.pageTitle',
        defaultMessage: 'Node List',
    },
    colContainerName: {
        id: 'Channel.Detail.NodeList.colContainerName',
        defaultMessage: 'Container Name',
    },
    colNodeName: {
        id: 'Channel.Detail.NodeList.colNodeName',
        defaultMessage: 'Node Name',
    },
    healthy: {
        id: 'Channel.Detail.NodeList.healthy',
        defaultMessage: 'healthy',
    },
    buttonAdd: {
        id: 'Channel.Detail.NodeList.buttonAdd',
        defaultMessage: 'Add Node',
    },
    buttonBack: {
        id: 'Channel.Detail.NodeList.buttonBack',
        defaultMessage: 'Back',
    },
    nodeRole: {
        id: 'Channel.Detail.NodeList.nodeRole',
        defaultMessage: 'Node Role',
    },
    buttonCancel: {
        id: 'Channel.AppendOrg.buttonCancel',
        defaultMessage: 'Cancel',
    },
    buttonOk: {
        id: 'Channel.AppendOrg.buttonOk',
        defaultMessage: 'Ok',
    },
    healthyNormal: {
        id: 'Channel.Detail.NodeList.healthyNormal',
        defaultMessage: 'Normal',
    },
    healthyFault: {
        id: 'Channel.Detail.NodeList.healthyFault',
        defaultMessage: 'Fault',
    },
});

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

@connect(({ ChannelDetail, ChannelList, loading }) => ({
    ChannelDetail,
    loadingInfo: loading.models.ChannelDetail,
}))

export default class PeerList extends PureComponent {
    state = {
        modalVisible: false,
        modalTitle: '',
        modalChaincodeQuery: true,
        modalEndorsingPeer: true,
        modalLedgerQuery: true
    };
    
    clickCancel = () => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'ChannelList',
            })
        );
    };
    
    onAddPeer = ()  =>{
        const {channelId}=this.props;
        this.props.dispatch(
            routerRedux.push({
                pathname: 'AddPeer',
                search: stringify({
                    id: channelId,
                })
            })
        )
        
    };
    
    changeRole = (row) => {
        console.log('row', row);
        this.setState({
            modalVisible: true,
            modalTitle: row.name,
            modalChaincodeQuery: row.role.indexOf('chaincodeQuery') !== -1,
            modalEndorsingPeer: row.role.indexOf('endorsingPeer') !== -1,
            modalLedgerQuery: row.role.indexOf('ledgerQuery') !== -1
        });
    };
    
    onChaincodeQuery = (e) => {
        this.setState({
            modalChaincodeQuery: e.target.checked
        })
    };
    
    onEndorsingPeer = (e) => {
        this.setState({
            modalEndorsingPeer: e.target.checked
        })
    };
    
    onLedgerQuery = (e) => {
        this.setState({
            modalLedgerQuery: e.target.checked
        })
    };
    
    onCommit = () => {
        const {channelId}=this.props;
        this.props.dispatch({
            type:    'ChannelDetail/changeRole',
            payload:  {
                dispatch: this.props.dispatch,
                info: {
                    channel_id: channelId,
                    peer: {
                        name: this.state.modalTitle,
                        roles: {
                            chaincodeQuery: this.state.modalChaincodeQuery,
                            endorsingPeer: this.state.modalEndorsingPeer,
                            ledgerQuery: this.state.modalLedgerQuery
                        }
                    }
                }
            },
        });
        this.setState({
            modalVisible: false
        })
    };
    
    ModalCancel = () => {
        this.setState({
            modalVisible: false,
        });
    };
    
    render() {
        
        const {
            peers,
            loadingPeers,
            submitting
        } = this.props;
        
        const deployColumns = [
            {
                title: intl.formatMessage(messages.colContainerName),
                dataIndex: 'docker',
                key: 'docker',
            },
            {
                title: intl.formatMessage(messages.colNodeName),
                dataIndex: 'name',
                key: 'peer',
            },
            {
                title: 'ip',
                dataIndex: 'ip',
                key: 'ip',
            },
            {
                title: intl.formatMessage(messages.healthy),
                dataIndex: 'healthyState',
                key: 'healthyState',
                render: val =>
                    <Badge
                        status={val ? 'success': 'error'}
                        text={val ?
                            intl.formatMessage(messages.healthyNormal) :
                            intl.formatMessage(messages.healthyFault)
                        }
                    />,
            },
            {
                title: intl.formatMessage(messages.nodeRole),
                render: row => (
                    <Fragment>
                        {
                            window.username.split('@')[0] === 'Admin' ?
                                <a onClick={() => this.changeRole(row)}>{`${row.role}`}</a> :
                                row.role
                        }
                    </Fragment>)
            },
        ];
        return (
            <div>
                <Card
                    title={intl.formatMessage(messages.pageTitle)}
                    bordered={false}
                >
                    
                    <div className={styles.tableList}>
                        <Table
                            pagination={false}
                            loading={loadingPeers}
                            columns={deployColumns}
                            dataSource={peers}
                        />
                    </div>
                    <Button icon="rollback" type="primary" style={{ marginTop: 20 }} onClick={this.clickCancel}>
                        {intl.formatMessage(messages.buttonBack)}
                    </Button>
                    <Button icon="plus" type="primary" style={{ marginLeft: 8 }} onClick={this.onAddPeer}>
                        {intl.formatMessage(messages.buttonAdd)}
                    </Button>
                </Card>
                {!this.state.modalVisible ? '' :
                    <Modal
                        title={this.state.modalTitle}
                        visible={this.state.modalVisible}
                        onOk={this.onCommit}
                        onCancel={this.ModalCancel}
                        okText={intl.formatMessage(messages.buttonOk)}
                        cancelText={intl.formatMessage(messages.buttonCancel)}
                        confirmLoading={submitting}
                    >
                        <div>
                            <Checkbox
                                style={{marginLeft:30}}
                                checked={this.state.modalChaincodeQuery}
                                disabled={!this.state.modalEndorsingPeer && !this.state.modalLedgerQuery}
                                onChange={this.onChaincodeQuery}
                            >
                                chaincodeQuery
                            </Checkbox>
                        </div>
                        <div>
                            <Checkbox
                                style={{marginLeft:30}}
                                checked={this.state.modalEndorsingPeer}
                                disabled={!this.state.modalChaincodeQuery && !this.state.modalLedgerQuery}
                                onChange={this.onEndorsingPeer}
                            >
                                endorsingPeer
                            </Checkbox>
                        </div>
                        <div>
                            <Checkbox
                                style={{marginLeft:30}}
                                checked={this.state.modalLedgerQuery}
                                disabled={!this.state.modalEndorsingPeer && !this.state.modalChaincodeQuery}
                                onChange={this.onLedgerQuery}
                            >
                                ledgerQuery
                            </Checkbox>
                        </div>
                    </Modal>
                }
            </div>
        );
    }
}
