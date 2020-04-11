import React, { PureComponent, Fragment } from 'react';
import { Resizable } from 'react-resizable';
import { connect, } from 'dva';
import { routerRedux } from 'dva/router';
import {
    Card,
    Form,
    Button,
    Divider,
    Table,
    Icon,
} from 'antd';
import { stringify } from 'qs';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import Ellipsis from '../../components/Ellipsis'
import styles from './ChannelList.less';
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from "../../utils/utils";

const messages = defineMessages({
    colNet: {
        id: 'Channel.List.ColNet',
        defaultMessage: 'Block Chain Network',
    },
    colChannel: {
        id: 'Channel.List.ColChannel',
        defaultMessage: 'Channel',
    },
    colDescription: {
        id: 'Channel.List.ColDescription',
        defaultMessage: 'Description',
    },
    colPeerOrgNum: {
        id: 'Channel.List.ColPeerOrgNumber',
        defaultMessage: 'Peer Organization Number',
    },
    colNodeNum: {
        id: 'Channel.List.ColNodeNumber',
        defaultMessage: 'Node Number',
    },
    colOperation: {
        id: 'Channel.List.ColOperation',
        defaultMessage: 'Operation',
    },
    buttonCreate: {
        id: 'Channel.List.ButtonCreate',
        defaultMessage: 'Create Channel',
    },
    buttonRefresh: {
        id: 'Channel.List.ButtonRefresh',
        defaultMessage: 'Refresh',
    },
    linkDetail: {
        id: 'Channel.List.LinkDetail',
        defaultMessage: 'Detail',
    },
    linkAddPeer: {
        id: 'Channel.List.LinkAddPeer',
        defaultMessage: 'Add Node',
    },
    linkAddOrg: {
        id: 'Channel.List.LinkAddOrg',
        defaultMessage: 'Append Organization',
    },
    linkLeaveChannel: {
        id: 'Channel.List.linkLeaveChannel',
        defaultMessage: 'Exit Channel',
    },
    pageTitle: {
        id: 'Channel.List.pageTitle',
        defaultMessage: 'Channel List',
    },
    pageDesc: {
        id: 'Channel.List.pageDesc',
        defaultMessage: 'Channel is the communication channel for executing transactions among organizations in block chain network.The transactions generated in the channel are visible only to the members in the same channel.',
    }
});

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

const ResizeableTitle = (props) => {
    const { onResize, width, ...restProps } = props;
    
    if (!width) {
        return <th {...restProps} />;
    }
    return (
        <Resizable width={width} height={0} onResize={onResize}>
            <th {...restProps} />
        </Resizable>
    );
};

const getValue = obj =>
    Object.keys(obj)
        .map(key => obj[key])
        .join(',');

@connect(({ ChannelList,loading }) => ({
    ChannelList,
    loading: loading.models.ChannelList,
    loadingInfo:loading.effects['peerList/fetch'],
}))
@Form.create()
export default class ChannelList extends PureComponent {
    state = {
        columns: [{
            title: intl.formatMessage(messages.colNet),
            dataIndex: 'net_name',
            key: 'net_name',
            width: 100,
            render: val => <Ellipsis tooltip lines={1}>{val}</Ellipsis>
        },
            /*  {
                  title: '通道ID',
                  dataIndex: 'id',
                  key: 'id',
                  width: 180,
                  defaultSortOrder: 'descend',
                  sorter: (a, b) => a.id- b.id,
              },  */
        {
            title: intl.formatMessage(messages.colChannel),
            dataIndex: 'name',
            key: 'name',
            width: 120,
            defaultSortOrder: 'descend',
            sorter: (a, b) => a.name.length - b.name.length,
            render: val => <Ellipsis tooltip lines={1}>{val}</Ellipsis>,
        },
        {
            title: intl.formatMessage(messages.colDescription),
            dataIndex: 'description',
            width: 120,
            render: val => <Ellipsis tooltip lines={1}>{val}</Ellipsis>,
        },
        {
            title: intl.formatMessage(messages.colPeerOrgNum),
            dataIndex: 'peer_orgs',
            key: 'peer_orgs',
            width: 80,
            defaultSortOrder: 'descend',
            sorter: (a, b) => a.peer_orgs.length - b.peer_orgs.length,
            render: val => <Ellipsis tooltip lines={1}>{val.length}</Ellipsis>,
        },
        {
            title: intl.formatMessage(messages.colNodeNum),
            dataIndex: 'peer_num',
            width: 80,
            defaultSortOrder: 'descend',
            sorter: (a, b) => a.peer_num - b.peer_num,
            render: val => <Ellipsis lines={1}>{val}</Ellipsis>,
        },
        
        /*  {
              title: '创建者',
              dataIndex: 'creator_id',
              width: 100,
              sorter: (a, b) => a.create_name - b.create_name,
              render: val => <Ellipsis tooltip lines={1}>{val}</Ellipsis>,
          },
          {
              title: '创建时间',
              dataIndex: 'create_time',
              width: 100,
              sorter: (a, b) => a.create_time - b.create_time,
              render: val => <span>{moment(val).format('YYYY-MM-DD HH:mm:ss')}</span>,
        }, */
        {
            title: intl.formatMessage(messages.colOperation),
            width: 250,
            render: (row) => (
                <Fragment>
                    <a   onClick={() => this.onChannelDetail(row)}>{intl.formatMessage(messages.linkDetail)}</a>
                    {window.localStorage["cello-authority"] === "operator" ? "" :
                        <nobr>
                            <Divider type="vertical"/>
                            <a onClick={() => this.onAddPeer(row)}>{intl.formatMessage(messages.linkAddPeer)}</a>
                            <Divider type="vertical"/>
                            <a onClick={() => this.onAddOrg(row)}>{intl.formatMessage(messages.linkAddOrg)}</a>
                            <Divider type="vertical"/>
                            <a onClick={() => this.onLeaveChannel(row)}>{intl.formatMessage(messages.linkLeaveChannel)}</a>
                        </nobr>
                    }
                </Fragment>
            ),
        }],
    };
    
    
    componentDidMount() {
        const { dispatch } = this.props;
        dispatch({
            type: 'ChannelList/fetch',
        });
    }
    
    onChannelDetail =(row) => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'ChannelDetail',
                search: stringify({
                    id: row.id,
                })
                
            })
        )
    };
    
    onAddOrg =(row) => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'OrgExpand',
                search: stringify({
                    id: row.id,
                })
                
            })
        )
    };
    
    onLeaveChannel =(row) => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'LeaveChannel',
                search: stringify({
                    id: row.id,
                })
            })
        )
    };
    
    onAddPeer =(row) => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'AddPeer',
                search: stringify({
                    id: row.id,
                })
            })
        )
    };
    
    
    handleFormReset = () => {
        const { dispatch } = this.props;
        dispatch({
            type: 'ChannelList/fetch',
        });
    };
    
    /* handleSelectRows = rows => {
       this.setState({
         selectedRows: rows,
       });
     };  */
    
    
    onAddNewChannel = () =>{
        this.props.dispatch(
            routerRedux.push({
                pathname: 'NewChannel',
            })
        )
    };
    
    components = {
        header: {
            cell: ResizeableTitle,
        },
    };
    
    handleResize = index => (e, { size }) => {
        this.setState(({ columns }) => {
            const nextColumns = [...columns];
            nextColumns[index] = {
                ...nextColumns[index],
                width: size.width,
            };
            return { columns: nextColumns };
        });
    };
    
    
    render() {
        const {
            ChannelList: { channels },
            loading,
        } = this.props;
        
        const paginationProps = {
            showSizeChanger: true,
            showQuickJumper: true,
        };
        
        
        const columns = this.state.columns.map((col, index) => ({
            ...col,
            onHeaderCell: column => ({
                width: column.width,
                onResize: this.handleResize(index),
            }),
        }));
        
        //  console.log(channels);
        
        return (
            <PageHeaderLayout title={intl.formatMessage(messages.pageTitle)}
                              content={intl.formatMessage(messages.pageDesc)}
                              logo={<Icon type="share-alt" style={{fontSize: 30, color: '#722ed1'}} />}   >
                <Card bordered={false}>
                    <div className={styles.tableList}>
                        <div className={styles.tableListOperator}>
                            {window.localStorage["cello-authority"] === "operator" ? "" :
                                <Button icon="plus" type="primary" onClick={this.onAddNewChannel}>
                                    {intl.formatMessage(messages.buttonCreate)}
                                </Button>
                            }
                            <Button icon="sync" type="primary" style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
                                {intl.formatMessage(messages.buttonRefresh)}
                            </Button>
                        </div>
                        <Table
                            components={this.components}
                            className={styles.table}
                            loading={loading}
                            dataSource={channels}
                            columns={columns}
                            pagination={paginationProps}
                            onChange={this.handleTableChange}
                        />
                    </div>
                </Card>
            </PageHeaderLayout>
        );
        
    }
    
}
