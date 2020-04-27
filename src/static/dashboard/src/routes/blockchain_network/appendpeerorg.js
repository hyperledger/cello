import React, { PureComponent } from 'react';
import { connect } from 'dva';
import PropTypes from 'prop-types';
import { Form, Input, Button, Card, Select,Table, Icon } from 'antd';
import { routerRedux } from 'dva/router';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import DescriptionList from 'components/DescriptionList';
import styles from './addnetwork.less';
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from "../../utils/utils";

const messages = defineMessages({
    pageTitle: {
        id: 'Network.AppendPageTitle',
        defaultMessage: 'Append Peer Organization'
    },
    pageDescription: {
        id: 'Network.AppendPageDesc',
        defaultMessage: 'In this page,you can append \"peer\" organization to the network.'
    },
    tableTitle: {
        id: 'Network.AppendTableTitle',
        defaultMessage: 'The organizations are already in network \"{name}\"'
    },
    colName: {
        id: 'Network.AppendColName',
        defaultMessage: 'Name'
    },
    colPeerNumber: {
        id: 'Network.AppendColPeerNumber',
        defaultMessage: 'Peer Number'
    },
    choosePeerOrg: {
        id: 'Network.AppendPeerOrgSel',
        defaultMessage: 'Choose Peer Organization'
    },
    choosePeerOrgName: {
        id: 'Network.AppendPeerOrgSelName',
        defaultMessage: 'Choose the name of the peer organization'
    },
    chooseOrdererOrg: {
        id: 'Network.AppendOrdererOrgSel',
        defaultMessage: 'Choose Orderer Organization'
    },
    chooseOrdererOrgName: {
        id: 'Network.AppendOrdererOrgSelName',
        defaultMessage: 'Choose the name of the orderer organization'
    },
    cancel: {
        id: 'Network.AppendCancel',
        defaultMessage: 'Cancel'
    },
    Ok: {
        id: 'Network.AppendOk',
        defaultMessage: 'Ok'
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
const { Description } = DescriptionList;

@connect(({ networklist, organization,loading }) => ({
    organization,
    networklist,
    submitting: loading.effects['networklist/netaddorg'],
    loading: loading.models.organization,
}))

@Form.create()
export default class AppendPeerOrg extends PureComponent {
    componentWillMount() {
        const location = this.props.location || this.context.location;
        const search = new URLSearchParams(location.search);
        const networkId = search.get('id');
        const { dispatch } = this.props;
        dispatch({
            type: 'networklist/fetchNetworkDetail',
            payload:{
                netId:networkId,
            },
        });
        this.props.dispatch({
            type: 'organization/fetch',
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
        const { form } = this.props;
        const location = this.props.location || this.context.location;
        const search = new URLSearchParams(location.search);
        const networkId = search.get('id');
        form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                const peer_orgs = values.peerorgs;
                const orderer_orgs = values.ordererorgs;
                const blockchain_network={peer_orgs,orderer_orgs};
                
                this.props.dispatch({
                    type: 'networklist/netaddorg',
                    payload: {
                        networkId,
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
            organization : {organization},
            networklist : {blockchain_networks},
            loading,
        } = this.props;
        const { form, submitting } = this.props;
        const { getFieldValue } = form;
        const { getFieldDecorator } = this.props.form;
        
        
        const  curnetwork=blockchain_networks;
        const orglist = Array.isArray(blockchain_networks.list) ? blockchain_networks.list : [];
        const  curnetworklist = orglist.filter(orgItem => (orgItem.type === 'peer'));
        
        const PeerColumns = [
            {
                title: intl.formatMessage(messages.colName),
                dataIndex: 'name',
            },
            {
                title: intl.formatMessage(messages.colPeerNumber),
                dataIndex: 'peerNum',
            },
        ];
        
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
        
        const orgs = Array.isArray(organization) ? organization : [];
        
        const peerorgs = orgs.filter(orgItem => (orgItem.type === 'peer' && (orgItem.blockchain_network_id === '' || orgItem.blockchain_network_id === null)));
        const orgpeerOptions = peerorgs.map(peerorg => (
            <Option key={peerorg.id} value={peerorg.id}>
                <span>{peerorg.name}</span>
            </Option>
        ));
        
        const ordererorgs = orgs.filter(orgItem => (orgItem.type === 'orderer' && (orgItem.blockchain_network_id === '' || orgItem.blockchain_network_id === null)));
        const orgordererOptions = ordererorgs.map(ordererorg => (
            <Option key={ordererorg.id} value={ordererorg.id}>
                <span>{ordererorg.name}</span>
            </Option>
        ));
        
        return (
            <PageHeaderLayout
                title={intl.formatMessage(messages.pageTitle)}
                content={intl.formatMessage(messages.pageDescription)}
                logo={<Icon type="cluster" style={{fontSize: 30, color: '#722ed1'}} />}
            >
                <Card bordered={false}>
                    <DescriptionList size="large" title={intl.formatMessage(messages.tableTitle, {name: curnetwork.name})} style={{ marginBottom: 32 }} />
                    <Table
                        className={styles.table}
                        loading={loading}
                        dataSource={curnetworklist}
                        columns={PeerColumns}
                    
                    />
                    
                    <Form onSubmit={this.handleSubmit} hideRequiredMark style={{ marginTop: 8 }}>
                        <FormItem
                            {...formItemLayout}
                            label={intl.formatMessage(messages.choosePeerOrg)}
                        >
                            {getFieldDecorator('peerorgs', {
                                initialValue: [],
                                rules: [
                                    {
                                        required: false,
                                        message: intl.formatMessage(messages.choosePeerOrg),
                                    },
                                ],
                            })(<Select mode="multiple" placeholder={intl.formatMessage(messages.choosePeerOrgName)}>{orgpeerOptions}</Select>)}
                        </FormItem>
                        <FormItem {...submitFormLayout} style={{ marginTop: 32 }}>
                            <Button onClick={this.clickCancel} >{intl.formatMessage(messages.cancel)}</Button>
                            <Button type="primary" htmlType="submit" loading={submitting} style={{ marginLeft: 8 }}>
                                {intl.formatMessage(messages.Ok)}
                            </Button>
                        </FormItem>
                    </Form>
                </Card>
            </PageHeaderLayout>
        );
    }
}
