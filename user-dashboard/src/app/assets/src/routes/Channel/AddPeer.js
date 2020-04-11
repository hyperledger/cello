import React, { PureComponent } from 'react';
import { connect } from 'dva';
import {
    Card,
    Form,
    Button,
    Modal,
    Table,
    Icon,
    Select
} from 'antd';
import { routerRedux } from 'dva/router';
import FooterToolbar from '../../components/FooterToolbar';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './OrgExpand.less';
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from "../../utils/utils";

const messages = defineMessages({
    commitWarning: {
        id: 'Channel.CommitWarning',
        defaultMessage: 'Please select at least one node for submission.',
    },
    pageTitle: {
        id: 'Channel.AddPeerPageTitle',
        defaultMessage: 'Add Node',
    },
    pageDesc: {
        id: 'Channel.AddPeerPageDesc',
        defaultMessage: 'Any node in the organization can be selected to join the current channel.',
    },
    colName: {
        id: 'Channel.AddPeerColName',
        defaultMessage: 'Name',
    },
    colRole: {
        id: 'Channel.AddPeerColRole',
        defaultMessage: 'Role',
    },
    back: {
        id: 'Channel.AddPeerButtonBack',
        defaultMessage: 'Back',
    },
    commit: {
        id: 'Channel.AddPeerButtonOk',
        defaultMessage: 'Ok',
    },
    roleWarning: {
        id: 'Channel.LessRoleWarning',
        defaultMessage: 'Please set up roles for all selected peers.',
    }
});

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();
const FormItem = Form.Item;

const { Option } = Select;

@connect(({ AddPeer, loading }) => ({
    AddPeer,
    submitting: loading.effects['AddPeer/add'],
    loading: loading.models.AddPeer,
}))
@Form.create()
export default class TableList extends PureComponent {
    constructor(props){
        super(props);
        const { AddPeer: { data } } = this.props;

        this.state = {
            modalVisible: false,
            formValues: {},
            selectedRowKeys: data.selected,
            flash: false,
            peerInfo: {}
        };
    }

    componentDidMount() {
        const { dispatch } = this.props;
        const location = this.props.location;
        const search = new URLSearchParams(location.search);
        const channelId = search.get('id');

        dispatch({
            type: 'AddPeer/getPeersForChannel',
            payload: {channel_id:channelId}
        });
    }


    clickCancel = () => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'ChannelList',
            })
        );
    };

    onSelectedRowKeysChange = keys => {
        this.setState({
            selectedRowKeys: keys,
            flash: true
        });
    };

    handleAdd = () => {
        const { dispatch } = this.props;
        const peers = [];
        const location = this.props.location;
        const search = new URLSearchParams(location.search);
        const channelId = search.get('id');
        const { AddPeer: { data } } = this.props;

        if (this.state.selectedRowKeys.length <= data.selected.length){
            Modal.error({
                title: intl.formatMessage(messages.commitWarning)
            });
            return;
        }
        for (const select in this.state.selectedRowKeys) {
            if (0 > data.selected.indexOf(this.state.selectedRowKeys[select])) {
                peers.push(data.list[this.state.selectedRowKeys[select]].name);
            }
        }
        
        const peerForCommit = [];
        for (const peer in peers) {
            if (!this.state.peerInfo.hasOwnProperty(peers[peer])) {
                Modal.error({
                    title: intl.formatMessage(messages.roleWarning)
                });
                return;
            }
            else {
                if (this.state.peerInfo[peers[peer]].length === 0) {
                    Modal.error({
                        title: intl.formatMessage(messages.roleWarning)
                    });
                    return;
                }
            }
            
            peerForCommit.push({
                name: peers[peer],
                roles: {
                    "chaincodeQuery": this.state.peerInfo[peers[peer]].includes('chaincodeQuery'),
                    "endorsingPeer": this.state.peerInfo[peers[peer]].includes('endorsingPeer'),
                    "ledgerQuery": this.state.peerInfo[peers[peer]].includes('ledgerQuery')
                }
            })
        }
        

        dispatch({
            type: 'AddPeer/add',
            payload: {
                peers: peerForCommit,
                channelId: channelId
            },
        });

        this.setState({
            modalVisible: false,
        });
    };

    selectRoles = (row, val) => {
        const infor = this.state.peerInfo;
        
        infor[row.name] = val;
        this.setState({
            peerInfo: infor
        });
    };

    render() {
        const {
            AddPeer: { data },
            submitting,
        } = this.props;

        const  selectedRowKeys  = this.state.flash ? this.state.selectedRowKeys : data.selected;
        const rowSelection = {
            selectedRowKeys,
            onChange: this.onSelectedRowKeysChange,
            getCheckboxProps: record => ({
                disabled: data.selected.indexOf(record.key) >= 0
            })
        };

        const columns = [
            {
                title: intl.formatMessage(messages.colName),
                dataIndex: 'name',
                width: '30%'
            },
            {
                title: intl.formatMessage(messages.colRole),
                width: '70%',
                render: (text, record) => ( data.selected.includes(record.key) ? record.role :
                    <div style={{wordWrap: 'break-word', wordBreak: 'break-all'}}>
                        <Select style={{minWidth: 150, marginLeft: 0}} mode={'multiple'} onChange={val => this.selectRoles(record,val)} >
                            <Option key={1} value={'chaincodeQuery'}>
                                <span>{'chaincodeQuery'}</span>
                            </Option>
                            <Option key={2} value={'endorsingPeer'}>
                                <span>{'endorsingPeer'}</span>
                            </Option>
                            <Option key={3} value={'ledgerQuery'}>
                                <span>{'ledgerQuery'}</span>
                            </Option>
                        </Select>
                    </div>
                )
            },
        ];

        return (
            <PageHeaderLayout title={intl.formatMessage(messages.pageTitle)}
                              content={intl.formatMessage(messages.pageDesc)}
                              logo={<Icon type="share-alt" style={{fontSize: 30, color: '#722ed1'}} />}
            >
                <FormItem onSubmit={this.handleSubmit} hideRequiredMark>
                    <Card bordered={false}>
                        <div className={styles.tableList}>
                            <Table
                                rowSelection={rowSelection}
                                columns={columns}
                                dataSource={data.list}
                            />
                        </div>
                    </Card>
                    <FooterToolbar>
                        <Button icon="rollback" type="primary" style={{ marginLeft:10 }} onClick={this.clickCancel}>
                            {intl.formatMessage(messages.back)}
                        </Button>
                        <Button type="primary" onClick={this.handleAdd} loading={submitting}>
                            {intl.formatMessage(messages.commit)}
                        </Button>
                    </FooterToolbar>
                </FormItem>
            </PageHeaderLayout>
        );
    }
}
