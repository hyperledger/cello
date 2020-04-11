import React, { PureComponent } from 'react';
import { Card, Form, Input, Button, Upload, Icon, message,Select } from 'antd';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import PropTypes from 'prop-types';
import pathToRegexp from 'path-to-regexp';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import StandardFormRow from '../../components/StandardFormRow';
import config from '../../utils/config';
import {defineMessages, IntlProvider} from "react-intl";
import {getLocale} from "../../utils/utils";

const messages = defineMessages({
    title: {
        id: 'ChainCode.Install.Title',
        defaultMessage: 'ChainCode install',
    },
    description: {
        id: 'ChainCode.Install.Description',
        defaultMessage: 'Please select nodes that need to install the ChainCode.',
    },
    nodeSelect: {
        id: 'ChainCode.Install.NodeSelect',
        defaultMessage: 'Please select nodes',
    },
    submit:{
        id: 'ChainCode.Submit',
        defaultMessage: 'Submit',
    },
    cancel:{
        id: 'ChainCode.Cancel',
        defaultMessage: 'Cancel',
    },
});

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

const FormItem = Form.Item;
const { Option } = Select;

@connect(({ InstantChainCode,ChainCodeList,loading,submitting }) => ({
    InstantChainCode,
    ChainCodeList,
    loading:loading.models.InstantChainCode,
    submitting: loading.effects['ChainCodeList/install']
}))

@Form.create()
export default class InstallChainCode extends PureComponent {
    state = {
        submitting: false,
        smartContractId: '',
        smartContractCodeId: '',
    };
    
    componentDidMount() {
        const location = this.props.location || this.context.location;
        const search = new URLSearchParams(location.search);
        const chaincodeId = search.get('id');
        this.props.dispatch({
            type: 'InstantChainCode/fetch',
            payload: {
                id:chaincodeId,
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
    handleSubmit = e => {
        e.preventDefault();
        // const { submitting, smartContractCodeId, smartContractId } = this.state;
        const location = this.props.location || this.context.location;
        const search = new URLSearchParams(location.search);
        const chaincodeId = search.get('id');
        this.props.form.validateFieldsAndScroll({ force: true }, (err, values) => {
            if (!err) {
                const   install={
                    "peers":values.peers,    // .split('\n'),
                };
                this.props.dispatch({
                    type: 'ChainCodeList/install',
                    payload: {
                        id:chaincodeId,
                        install: install,
                        callback: this.submitCallback,
                    },
                })
            }
        });
    };
    
    render() {
        const {
            InstantChainCode: { Instant },
            submitting,
        } = this.props;
        const { getFieldDecorator } = this.props.form;
        //  const peerOptions = Array.isArray(Instant.peers) ? Instant.peers: [];
        const filterPeerOptions = Array.isArray(Instant) ? Instant: [];   //安装过链码的节点
        
        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 7 },
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 12 },
                md: { span: 10 },
            },
        };
        const submitFormLayout = {
            wrapperCol: {
                xs: { span: 24, offset: 0 },
                sm: { span: 10, offset: 14 },
            },
        };
        
        return (
            <PageHeaderLayout
                title={intl.formatMessage(messages.title)}
                content={intl.formatMessage(messages.description)}
                logo={<Icon type="link" style={{fontSize: 30, color: '#722ed1'}} />}
            >
                <Card bordered={false}>
                    <Form onSubmit={this.handleSubmit} hideRequiredMark style={{marginTop: 8}}>
                        <FormItem {...formItemLayout} label={intl.formatMessage(messages.nodeSelect)}>
                            <StandardFormRow>
                                {getFieldDecorator('peers', {
                                    rules: [
                                        {
                                            required: true,
                                            message: intl.formatMessage(messages.nodeSelect),
                                        },
                                    ],
                                })(
                                    <Select
                                        mode="multiple"
                                        style={{maxWidth: 510, width: '100%'}}
                                        placeholder={intl.formatMessage(messages.nodeSelect)}
                                    >
                                        {filterPeerOptions.map(peers => (
                                            <Option key={peers.name} value={peers.name}>
                                                {peers.name}
                                            </Option>
                                        ))}
                                    </Select>
                                )}
                            </StandardFormRow>
                        </FormItem>
                        <FormItem {...submitFormLayout} style={{marginTop: 32}}>
                            <Button onClick={this.clickCancel}>
                                {intl.formatMessage(messages.cancel)}
                            </Button>
                            <Button loading={submitting} type="primary" htmlType="submit" style={{marginLeft: 10}}>
                                {intl.formatMessage(messages.submit)}
                            </Button>
                        </FormItem>
                    </Form>
                </Card>
            </PageHeaderLayout>
        );
    }
}


