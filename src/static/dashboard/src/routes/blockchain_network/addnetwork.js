import React, { PureComponent } from 'react';
import { connect } from 'dva';
import PropTypes from 'prop-types';
import { Form, Input, Button, Card, Select, Icon } from 'antd';
import { routerRedux } from 'dva/router';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './addnetwork.less';
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from "../../utils/utils";

const messages = defineMessages({
    create: {
        id: 'Network.Create',
        defaultMessage: 'Create'
    },
    pageDescription: {
        id: 'Network.CreateDesc',
        defaultMessage: 'When building a new network,if you find that you cannot choose an organization,make sure that there are available "peer" organizations and "orderer" organizations,because an organization can only be added to a network,so you can only choose organizations that are not joined to any network.',
    },
    name: {
        id: 'Network.CreateName',
        defaultMessage: 'Name',
    },
    nameForNetwork: {
        id: 'Network.CreateNameForNetwork',
        defaultMessage: 'Name the network',
    },
    description: {
        id: 'Network.CreateDescription',
        defaultMessage: 'Description',
    },
    descriptionForNetwork: {
        id: 'Network.CreateDescForNetwork',
        defaultMessage: 'Description of the network',
    },
    option: {
        id: 'Network.CreateDescOption',
        defaultMessage: '(Option)',
    },
    version: {
        id: 'Network.CreateVersion',
        defaultMessage: 'Fabric Version',
    },
    versionForSel: {
        id: 'Network.CreateVersionForSel',
        defaultMessage: 'Please choose the version of fabric',
    },
    peerOrganization: {
        id: 'Network.CreatePeerOrg',
        defaultMessage: 'Peer Organization',
    },
    peerOrganizationSel: {
        id: 'Network.CreatePeerOrgSel',
        defaultMessage: 'Choose Peer Organization',
    },
    ordererOrganization: {
        id: 'Network.CreateOrdererOrg',
        defaultMessage: 'Orderer Organization',
    },
    ordererOrganizationSel: {
        id: 'Network.CreateOrdererOrgSel',
        defaultMessage: 'Choose Orderer Organization',
    },
    host: {
        id: 'Network.CreateHost',
        defaultMessage: 'Host',
    },
    hostForSel: {
        id: 'Network.CreateHostForSel',
        defaultMessage: 'Please choose a host',
    },
    consensus: {
        id: 'Network.CreateConsensus',
        defaultMessage: 'Consensus',
    },
    consensusForSel: {
        id: 'Network.CreateConsensusForSel',
        defaultMessage: 'Please choose the consensus',
    },
    dbtypes: {
        id: 'Network.CreateDbType',
        defaultMessage: 'Database Type',
    },
    dbtypeForSel: {
        id: 'Network.CreateDbTypeForSel',
        defaultMessage: 'Please choose the database types',
    },
    commit: {
        id: 'Network.CreateCommit',
        defaultMessage: 'Commit',
    },
    cancel: {
        id: 'Network.CreateCancel',
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

@connect(({ networklist,loading }) => ({
    networklist,
    submitting: loading.effects['networklist/addnetwork'],
    loading: loading.models.networklist,
}))

@Form.create()
export default class CreateNet extends PureComponent {
    componentWillMount() {
        this.props.dispatch({
            type: 'networklist/fetchForAddNetwork',
        });
    }
    
    clickCancel = () => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'networklist',
            })
        );
    };
    
    submitCallback = () => {
        this.props.submitting = false;
    };
    
    isempty = val => {
        const str = "^[\\s]+$";
        const reg = new RegExp(str);
        if (reg.test(val)){
            return true;
        } else {
            return false;
        }
    };
    
    handleSubmit = e => {
        e.preventDefault();
        const { form, dispatch } = this.props;
        
        form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                const blockchain_network = {
                    "name": values.name,
                    "description": values.description,
                    "fabric_version":values.fabric_version,
                    "orderer_orgs": values.ordererorgs,
                    "peer_orgs":values.peerorgs,
                    "host_id":values.host_id,
                    "consensus_type": values.consensus_type,
                    "db_type": values.db_type,
                    callback: this.submitCallback,
                };
                dispatch({
                    type: 'networklist/addnetwork',
                    payload: {
                        blockchain_network,
                    },
                });
            }
        });
    };
    
    static contextTypes = {
        routes: PropTypes.array,
        params: PropTypes.object,
        location: PropTypes.object,
    };
    
    render() {
        const {
            networklist : {blockchain_networks},
        } = this.props;
        
        const { submitting } = this.props;
        const { getFieldDecorator } = this.props.form;
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
                sm: { span: 10, offset: 7 },
            },
        };
        const orgInfor = typeof(blockchain_networks.orgs) !== 'undefined' ? blockchain_networks.orgs : [];
        const peerorgs = orgInfor.filter(orgItem => (orgItem.type === 'peer' && (orgItem.blockchain_network_id === '' || orgItem.blockchain_network_id === null)));
        const orgpeerOptions = peerorgs.map(peerorg => (
            <Option key={peerorg.id} value={peerorg.id}>
                <span>{peerorg.name}</span>
            </Option>
        ));
        
        const ordererorgs = orgInfor.filter(orgItem => (orgItem.type === 'orderer' && (orgItem.blockchain_network_id === '' || orgItem.blockchain_network_id === null)));
        const orgordererOptions = ordererorgs.map(ordererorg => (
            <Option key={ordererorg.id} value={ordererorg.id}>
                <span>{ordererorg.name}</span>
            </Option>
        ));
        
        const fabveroptions = ['v1.4'];
        const fabVersionOptions = fabveroptions.map(fabveroption => (
            <Option value={fabveroption}>
                <span>{fabveroption}</span>
            </Option>
        ));
        
        const consensusoptions = ['etcdraft', 'solo'];
        const ConsensusOptions = consensusoptions.map(consensusoption => (
            <Option value={consensusoption}>
                <span>{consensusoption}</span>
            </Option>
        ));
        
        const dbtypeoptions = ['couchdb', 'leveldb'];
        const DbtypeOptions = dbtypeoptions.map(dbtypeoption => (
            <Option value={dbtypeoption}>
                <span>{dbtypeoption}</span>
            </Option>
        ));
        
        const hosts = typeof(blockchain_networks.hosts) !== 'undefined' ? blockchain_networks.hosts : [];
        const hostOptions = hosts.map(host => (
            <Option key={host.id} value={host.id}>
                <span>{host.name}</span>
            </Option>
        ));
        
        return (
            <PageHeaderLayout
                title={intl.formatMessage(messages.create)}
                content={intl.formatMessage(messages.pageDescription)}
                logo={<Icon type="cluster" style={{fontSize: 30, color: '#722ed1'}} />}
            >
                <Card bordered={false}>
                    <Form onSubmit={this.handleSubmit} hideRequiredMark style={{ marginTop: 8 }}>
                        <FormItem {...formItemLayout} label={intl.formatMessage(messages.name)}>
                            {getFieldDecorator('name', {
                                initialValue: '',
                                rules: [
                                    {
                                        required: true,
                                        message: intl.formatMessage(messages.nameForNetwork),
                                    },
                                ],
                            })(<Input placeholder={intl.formatMessage(messages.nameForNetwork)} />)}
                        </FormItem>
                        <FormItem
                            {...formItemLayout}
                            label={
                                <span>
                                    {intl.formatMessage(messages.description)}
                                    <em className={styles.optional}>
                                        {intl.formatMessage(messages.option)}
                                    </em>
                                </span>
                            }
                        >
                            {getFieldDecorator('description', {
                                initialValue: '',
                                rules: [
                                    {
                                        required: false,
                                        message: intl.formatMessage(messages.descriptionForNetwork),
                                    },
                                ],
                            })(<Input placeholder={intl.formatMessage(messages.descriptionForNetwork)} />)}
                        </FormItem>
                        <FormItem {...formItemLayout} label={intl.formatMessage(messages.version)}>
                            {getFieldDecorator('fabric_version', {
                                initialValue: '',
                                rules: [
                                    {
                                        required: true,
                                        message: intl.formatMessage(messages.versionForSel),
                                    },
                                ],
                            })(<Select>{fabVersionOptions}</Select>)}
                        </FormItem>
                        <FormItem
                            {...formItemLayout}
                            label={intl.formatMessage(messages.peerOrganization)}
                        >
                            {getFieldDecorator('peerorgs', {
                                initialValue: [],
                                rules: [
                                    {
                                        required: true,
                                        message: intl.formatMessage(messages.peerOrganizationSel),
                                    },
                                ],
                            })(<Select mode="multiple" placeholder={intl.formatMessage(messages.peerOrganizationSel)}>{orgpeerOptions}</Select>)}
                        </FormItem>
                        <FormItem
                            {...formItemLayout}
                            label={intl.formatMessage(messages.ordererOrganization)}
                        >
                            {getFieldDecorator('ordererorgs', {
                                initialValue: [],
                                rules: [
                                    {
                                        required: true,
                                        message: intl.formatMessage(messages.ordererOrganizationSel),
                                    },
                                ],
                            })(
                                <Select mode="multiple" placeholder={intl.formatMessage(messages.ordererOrganizationSel)}>{orgordererOptions}</Select>
                            )}
                        </FormItem>
                        <FormItem {...formItemLayout} label={intl.formatMessage(messages.host)}>
                            {getFieldDecorator('host_id', {
                                initialValue: '',
                                rules: [
                                    {
                                        required: true,
                                        message: intl.formatMessage(messages.hostForSel),
                                    },
                                ],
                            })(<Select>{hostOptions}</Select>)}
                        </FormItem>
                        <FormItem {...formItemLayout} label={intl.formatMessage(messages.consensus)}>
                            {getFieldDecorator('consensus_type', {
                                initialValue: '',
                                rules: [
                                    {
                                        required: true,
                                        message: intl.formatMessage(messages.consensusForSel),
                                    },
                                ],
                            })(<Select>{ConsensusOptions}</Select>)}
                        </FormItem>
                        <FormItem {...formItemLayout} label={intl.formatMessage(messages.dbtypes)}>
                            {getFieldDecorator('db_type', {
                                initialValue: '',
                                rules: [
                                    {
                                        required: true,
                                        message: intl.formatMessage(messages.dbtypeForSel),
                                    },
                                ],
                            })(<Select>{DbtypeOptions}</Select>)}
                        </FormItem>
                        <FormItem {...submitFormLayout} style={{ marginTop: 32 }}>
                            <Button onClick={this.clickCancel} >{intl.formatMessage(messages.cancel)}</Button>
                            <Button type="primary" htmlType="submit" loading={submitting} style={{ marginLeft: 8 }}>
                                {intl.formatMessage(messages.commit)}
                            </Button>
                        </FormItem>
                    </Form>
                </Card>
            </PageHeaderLayout>
        );
    }
}
