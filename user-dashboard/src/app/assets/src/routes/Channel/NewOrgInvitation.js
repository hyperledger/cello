import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import {
    Card,
    Form,
    Button,
    Divider,
    message,
} from 'antd';
import { stringify } from 'qs';
import { routerRedux } from 'dva/router';
import DescriptionList from '../../components/DescriptionList';
import StandardTable from '../../components/StandardTable';
import FooterToolbar from '../../components/FooterToolbar';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './OrgExpand.less';
import NewOrgInvitation from './NewOrgInvitation';


const { Description } = DescriptionList;

const FormItem = Form.Item;
const getValue = obj =>
    Object.keys(obj)
        .map(key => obj[key])
        .join(',');


@connect(({  ChannelList, OrgExpand,loading }) => ({
    ChannelList,
    OrgExpand,
    loading: loading.models.OrgExpand,
}))
@Form.create()
export default class OrgExpand extends PureComponent {
    state = {
        modalVisible: false,
        expandForm: false,
        selectedRows: [],
        formValues: {},
    };

    componentDidMount() {
        /*     const { dispatch } = this.props;
             dispatch({
                 type: 'OrgExpand/fetch',
             });
             this.props.dispatch({
                 type: 'ChannelList/fetch',
             });   */
    }

    handleStandardTableChange = (pagination, filtersArg, sorter) => {
        const { dispatch } = this.props;
        const { formValues } = this.state;

        const filters = Object.keys(filtersArg).reduce((obj, key) => {
            const newObj = { ...obj };
            newObj[key] = getValue(filtersArg[key]);
            return newObj;
        }, {});

        const params = {
            currentPage: pagination.current,
            pageSize: pagination.pageSize,
            ...formValues,
            ...filters,
        };
        if (sorter.field) {
            params.sorter = `${sorter.field}_${sorter.order}`;
        }

        dispatch({
            type: 'OrgExpand/fetch',
            payload: params,
        });
    };

    clickCancel = () => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'ChannelList',
            })
        );
    };

    handleSelectRows = rows => {
        this.setState({
            selectedRows: rows,
        });
    };

    handleAdd = fields => {
        const { dispatch } = this.props;
        dispatch({
            type: 'OrgExpand/add',
            payload: {
                description: fields.desc,
            },
        });

        message.success('添加成功');
        this.setState({
            modalVisible: false,
        });
    };

    onInvitation = () =>{
        const location = this.props.location || this.context.location;
        const search = new URLSearchParams(location.search);
        const channelId = search.get('id');
        this.props.dispatch(
            routerRedux.push({
                pathname: 'NewOrgInvitation',
                /*   payload:channelId,  */
                search: stringify({
                    id: channelId,
                }),
            })
        )
        console.log('channel');
        console.log(channelId);
        console.log('channel');

    }


    render() {
        const {
            OrgExpand: { data },
            ChannelList:{channels},
            loading,
            submitting,
        } = this.props;
        const { selectedRows, modalVisible } = this.state;

        console.log(110);
        console.log(this.props);
        console.log(110);



        const location = this.props.location || this.context.location;
        const search = new URLSearchParams(location.search);
        const channelId = search.get('id');
        const channelData = Array.isArray(channels.channels) ? channels.channels : [];
        const filterChannelData = channelData.filter(channelData => `${channelData.id}` === channelId);
        const currentChannel = filterChannelData.length > 0 ? filterChannelData[0] : {};

        console.log('channelID');
        console.log(channelId);
        console.log('channelID');


        const columns = [
            {
                title: '被邀请的组织',
                dataIndex: 'inviteOrg',
            },
            {
                title: '现有组织',
                dataIndex: 'existOrg',
            },
            {
                title: '邀请者',
                dataIndex: 'localOrg',
            },
            {
                title: '操作',
                width: 250,
                render: () => (
                    <Fragment>
                        <a >同意</a>
                        <Divider type="vertical" />
                        <a style={{color: 'red'}} >不同意</a>
                    </Fragment>
                ),
            }
        ];

        const description = (
            <DescriptionList className={styles.headerList}  col="2">
                <Description term="通道名称">{currentChannel.name}</Description>
            </DescriptionList>
        );



        /* console.log(555);
         console.log(filterChannelData);
         console.log(555);  */

        return (
            <PageHeaderLayout title="组织扩容"   content={description}>
                <FormItem onSubmit={this.handleSubmit} hideRequiredMark>
                    <Card bordered={false} >
                        <div  className={styles.tableListOperator}  style={{ marginBottom: 20 }}>
                            <Button icon="plus" type="primary" onClick={this.onInvitation}>
                                发起邀请
                            </Button>
                        </div>

                        <div className={styles.tableList}>
                            <StandardTable
                                selectedRows={selectedRows}
                                loading={loading}
                                data={data}
                                columns={columns}
                                onSelectRow={this.handleSelectRows}
                                onChange={this.handleStandardTableChange}
                            />
                        </div>
                        <Button icon="rollback" type="primary" style={{ marginLeft:10 }} onClick={this.clickCancel}>
                            返回
                        </Button>
                    </Card>
                </FormItem>
            </PageHeaderLayout>
        );
    }
}
