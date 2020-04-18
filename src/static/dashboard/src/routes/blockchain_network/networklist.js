import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import { Row, Col, Card, Form, Input, Select, Button, Divider, Icon } from 'antd';
import StandardTableForNetWork from 'components/StandardTableForNetWork';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './networklist.less';
import * as routerRedux from 'react-router-redux';
import { stringify } from 'qs';
import {Modal} from "antd/lib/index";
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from "../../utils/utils";

const messages = defineMessages({
    delConfirm: {
        id: 'Network.DelConfirm',
        defaultMessage: 'Number'
    },
    colName: {
        id: 'Network.Name',
        defineMessages: 'Network Name'
    },
    colDesc: {
        id: 'Network.Desc',
        defineMessages: 'Description'
    },
    colStatus: {
        id: 'Network.Status',
        defineMessages: 'Status'
    },
    colVersion: {
        id: 'Network.Version',
        defineMessages: 'Fabric Version'
    },
    colConsensus: {
        id: 'Network.Consensus',
        defineMessages: 'Consensus Type'
    },
    colOperation: {
        id: 'Network.Operation',
        defineMessages: 'Operation'
    },
    colOpDetail: {
        id: 'Network.OpDetail',
        defineMessages: 'Detail'
    },
    colOpAppendOrg: {
        id: 'Network.OpAppendOrg',
        defineMessages: 'Append Organization'
    },
    colOpDelete: {
        id: 'Network.OpDelete',
        defineMessages: 'Delete'
    },
    pageTitle: {
        id: 'Network.PageTitle',
        defineMessages: 'BlockChain Network'
    },
    pageDescription: {
        id: 'Network.PageDescription',
        defineMessages: 'Block chain network is a fabric network that runs on a designated host/cluster.In a network,all nodes belonging to the network organization are included,and all transactions use the same consensus.'
    },
    create: {
        id: 'Network.Create',
        defineMessages: 'Create'
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
const getValue = obj =>
    Object.keys(obj)
        .map(key => obj[key])
        .join(',');

@connect(({ networklist, loading }) => ({
    networklist,
    loading: loading.models.networklist,
}))
@Form.create()
export default class Networklist extends PureComponent {
    state = {
        formValues: {},
    };
    
    componentWillMount() {
        const { dispatch } = this.props;
        dispatch({
            type: 'networklist/fetch',
        });
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
            type: 'networklist/fetch',
            payload: params,
        });
    };
    
    handleFormReset = () => {
        const { form, dispatch } = this.props;
        form.resetFields();
        this.setState({
            formValues: {},
        });
        dispatch({
            type: 'networklist/fetch',
            payload: {},
        });
    };
    
    handleSearch = e => {
        e.preventDefault();
        
        const { dispatch, form } = this.props;
        
        form.validateFields((err, fieldsValue) => {
            if (err) return;
            
            const values = {
                ...fieldsValue,
                updatedAt: fieldsValue.updatedAt && fieldsValue.updatedAt.valueOf(),
            };
            
            this.setState({
                formValues: values,
            });
            
            dispatch({
                type: 'networklist/fetch',
                payload: values,
            });
        });
    };
    
    onClickAdd = () =>{
        this.props.dispatch(
            routerRedux.push({
                pathname: 'addnetwork',
            })
        )
    };
    
    renderSimpleForm() {
        const { form } = this.props;
        const { getFieldDecorator } = form;
        return (
            <Form onSubmit={this.handleSearch} layout="inline">
                <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
                    <Col md={8} sm={24}>
                        <FormItem label="关键字">
                            {getFieldDecorator('keyword')(<Input placeholder="请输入" />)}
                        </FormItem>
                    </Col>
                    <Col md={8} sm={24}>
                        <FormItem label="搜索条件">
                            {getFieldDecorator('status')(
                                <Select placeholder="请选择" style={{ width: '100%' }}>
                                    <Option value="0">网络名称</Option>
                                    <Option value="1">fabric版本</Option>
                                    <Option value="2">共识类型</Option>
                                </Select>
                            )}
                        </FormItem>
                    </Col>
                    <Col md={8} sm={24}>
                        <span className={styles.submitButtons}>
                            <Button type="primary" htmlType="submit">
                                查询
                            </Button>
                            <Button type="primary" style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
                                重置
                            </Button>
                        </span>
                    </Col>
                </Row>
            </Form>
        );
    }
    
    renderForm() {
        return this.renderSimpleForm();
    }
    
    appendorg = row => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'appendpeerorg',
                search: stringify({
                    id: row.id,
                }),
            })
        )
    };
    
    onClickDetail = row =>{
        this.props.dispatch(
            routerRedux.push({
                pathname: 'networkdetail',
                search: stringify({
                    id: row.id,
                }),
            })
        )
    };
    
    deleteNetwork = row =>{
        const { dispatch } = this.props;
        const name = row.name;
        Modal.confirm({
            title: intl.formatMessage(messages.delConfirm, {name}),
            onOk() {
                dispatch({
                    type: 'networklist/remove',
                    payload: {
                        netid: row.id,
                    },
                });
            },
        });
    };
    
    render() {
        const {
            networklist : {blockchain_networks},
            loading,
        } = this.props;
        
        const list = {list: blockchain_networks.blockchain_networks};
        
        const columns = [
            {
                title: intl.formatMessage(messages.colName),
                dataIndex: 'name',
            },
            {
                title: intl.formatMessage(messages.colDesc),
                dataIndex: 'description',
            },
            {
                title: intl.formatMessage(messages.colStatus),
                dataIndex: 'status',
            },
            {
                title: intl.formatMessage(messages.colVersion),
                dataIndex: 'fabric_version',
            },
            {
                title: intl.formatMessage(messages.colConsensus),
                dataIndex: 'consensus_type',
            },
            {
                title: intl.formatMessage(messages.colOperation),
                render: row => (
                    <Fragment>
                        <a onClick={() => this.onClickDetail(row)}>{intl.formatMessage(messages.colOpDetail)}</a>
                        <Divider type="vertical" />
                        <a onClick={() => this.appendorg(row)}>{intl.formatMessage(messages.colOpAppendOrg)}</a>
                        <Divider type="vertical" />
                        <a onClick={() => this.deleteNetwork(row)}>{intl.formatMessage(messages.colOpDelete)}</a>
                    </Fragment>
                ),
            },
        ];
        
        return (
            <PageHeaderLayout
                title={intl.formatMessage(messages.pageTitle)}
                logo={<Icon type="cluster" style={{fontSize: 30, color: '#722ed1'}} />}
                content={intl.formatMessage(messages.pageDescription)}
            >
                <Card bordered={false}>
                    <div className={styles.tableList}>
                        <div className={styles.tableListForm}>{/*this.renderForm()*/}</div>
                        <div className={styles.tableListOperator}>
                            <Button type="primary" icon="plus" onClick={() => this.onClickAdd()}>
                                {intl.formatMessage(messages.create)}
                            </Button>
                        </div>
                        <StandardTableForNetWork
                            loading={loading}
                            data={list}
                            columns={columns}
                            onSelectRow={this.handleSelectRows}
                            onChange={this.handleStandardTableChange}
                        />
                    </div>
                </Card>
            </PageHeaderLayout>
        );
    }
}
