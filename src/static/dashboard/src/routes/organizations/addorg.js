import React, { PureComponent } from 'react';
import { connect } from 'dva';
import PropTypes from 'prop-types';
import { Form, Input, Select, Button, Card, Icon } from 'antd';
import { routerRedux } from 'dva/router';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './addorg.less';
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from "../../utils/utils";

const messages = defineMessages({
    orgDetail: {
        id: 'Organization.Detail',
        defaultMessage: 'Organization Detail',
    },
    orgCreate: {
        id: 'Organization.Create',
        defaultMessage: 'Organization Create',
    },
    orgDetailCon: {
        id: 'Organization.Detail.Content',
        defaultMessage: 'Details of the organization',
    },
    orgCreateCon: {
        id: 'Organization.Create.Content',
        defaultMessage: 'When creating an organization,note that the name of the organization is not duplicated.',
    },
    orgName:{
        id: 'Organization.Col.Name',
        defaultMessage: 'Name',
    },
    inputName:{
        id: 'Organization.InputName',
        defaultMessage: 'Please enter the name of the organization',
    },
    orgNameWarning:{
        id: 'Organization.Name.Warning',
        defaultMessage: 'There are illegal characters or format errors in the name.Please modify,for example:\"org1\"',
    },
    orgNameDesc:{
        id: 'Organization.NameDesc',
        defaultMessage: 'Name the organization',
    },
    orgDesc:{
        id: 'Organization.Desc',
        defaultMessage: 'Description',
    },
    option:{
        id: 'Organization.option',
        defaultMessage: 'Option',
    },
    orgInputDesc:{
        id: 'Organization.InputDesc',
        defaultMessage: 'Please enter the description',
    },
    orgDomainInput:{
        id: 'Organization.DomainInput',
        defaultMessage: 'Please enter the domain',
    },
    orgDomainWarning:{
        id: 'Organization.DomainWarning',
        defaultMessage: 'Please enter the domain',
    },
    orgDomainFormatWarning:{
        id: 'Organization.FormatWarning',
        defaultMessage: 'The format is incorrect or illegal,please enter in this format:example.org',
    },
    orgDomainExample:{
        id: 'Organization.DomainExample',
        defaultMessage: 'For example: example.org',
    },
    orgTypeSelect:{
        id: 'Organization.TypeSelect',
        defaultMessage: 'Select Type',
    },
    orgTypeSelectWarning:{
        id: 'Organization.TypeSelectWarning',
        defaultMessage: 'You have to choose an organization type.',
    },
    orgPeerNumber:{
        id: 'Organization.PeerNumber',
        defaultMessage: 'Peer Number',
    },
    orgPeerNumberInput:{
        id: 'Organization.PeerNumberInput',
        defaultMessage: 'Please input the number of the peer',
    },
    orgPeerNumberWarning:{
        id: 'Organization.PeerNumberWarning',
        defaultMessage: 'The peer number can only be entered in non-zero,correct format numbers,for example:2,10.',
    },
    country:{
        id: 'Organization.Country',
        defaultMessage: 'Country',
    },
    province:{
        id: 'Organization.Province',
        defaultMessage: 'Province',
    },
    city:{
        id: 'Organization.City',
        defaultMessage: 'City',
    },
    countryInput:{
        id: 'Organization.CountryInput',
        defaultMessage: 'Please enter the country name.',
    },
    provinceInput:{
        id: 'Organization.ProvinceInput',
        defaultMessage: 'Please enter the province name.',
    },
    cityInput:{
        id: 'Organization.CityInput',
        defaultMessage: 'Please enter the city name.',
    },
    ordererHostnames:{
        id: 'Organization.OrdererHostnames',
        defaultMessage: 'Orderer Host Name',
    },
    ordererHostnamesInput:{
        id: 'Organization.OrdererHostnamesInput',
        defaultMessage: 'Please Enter Host Name',
    },
    ordererHostnamesWarning:{
        id: 'OrdererHost.Name.Warning',
        defaultMessage: 'There are illegal characters or format errors in the name.Please modify,for example:\"myhost1\"',
    },
    ordererHostnamesContent:{
        id: 'Organization.OrdererHostNamesContent',
        defaultMessage: 'One host name per line',
    },
    network:{
        id: 'Organization.Network',
        defaultMessage: 'Network',
    },
    cancel:{
        id: 'Organization.Cancel',
        defaultMessage: 'Cancel',
    },
    ok:{
        id: 'Organization.OK',
        defaultMessage: 'OK',
    },
    host: {
        id: 'Network.CreateHost',
        defaultMessage: 'Host',
    },
    hostForSel: {
        id: 'Network.CreateHostForSel',
        defaultMessage: 'Please choose a host',
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
const { TextArea } = Input;

@connect(({ organization,loading,host}) => ({
    organization,
    host,
    submitting: loading.effects['organization/createorg'],
    loading: loading.models.organization
}))

@Form.create()
export default class CreateOrg extends PureComponent {
    componentWillMount() {
        this.props.dispatch({
            type: 'host/fetchHosts',
        });
    }
    componentDidMount() {
        const { dispatch } = this.props;
        const location = this.props.location || this.context.location;
        const search = new URLSearchParams(location.search);
        const orgId = search.get('id');
        const action = search.get('action') || 'create';

        if (action !== 'create'){
            dispatch({
                type: 'organization/SearchOrgById',
                payload: {Id:orgId}
            });
        }
    }

    clickCancel = () => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'orglist',
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
    
    checkHostName = (rule, value, callback) => {
        if (value === '' || value === null) {
            callback();
        }
        else {
            const hostNames = value.split('\n');
            const regex = new RegExp("^[a-z](?:[0-9a-z\\-]*[0-9a-z])*$");

            for (let i = 0;i < hostNames.length;i++) {
                if (hostNames[i] === '' || hostNames[i] === null) {
                    continue;
                }
                if (!regex.test(hostNames[i])) {
                    callback(intl.formatMessage(messages.ordererHostnamesWarning));
                }
            }
            callback();
        }
    };

    handleSubmit = e => {
        e.preventDefault();
        const { form, dispatch } = this.props;
        const location = this.props.location || this.context.location;
        const search = new URLSearchParams(location.search);
        const orgId = search.get('id');
        const action = search.get('action') || 'create';

        form.validateFieldsAndScroll((err, values) => {
            if (!err) {

                let organization = { };
                let type;

                if (action === 'edit')
                {
                    organization = {
                        "description": values.description,
                        "id":orgId,
                        callback: this.submitCallback,
                    };

                    type = 'organization/updateorg';
                }
                else {
                    if (values.type === 'peer'){
                        organization = {
                            "name": values.name,
                            "description": values.description,
                            "domain":values.domain,
                            "type": values.type,
                            "peerNum":values.peerNum,
                            "host_id":values.host_id,
                            "ca": {
                                "country": values.country,
                                "province": values.province,
                                "locality": values.locality,
                            },
                            callback: this.submitCallback,
                        };
                    }
                    else{
                        const ordererNamesArray = values.ordererHostnames.split('\n');
                        const orderernames = ordererNamesArray.filter(item => item !== '' && item !== null);
                        organization = {
                            "name": values.name,
                            "description": values.description,
                            "domain": values.domain,
                            "type": values.type,
                            "ordererHostnames": orderernames,
                            "host_id":values.host_id,
                            "ca": {
                                "country": values.country,
                                "province": values.province,
                                "locality": values.locality,
                            },
                            callback: this.submitCallback,
                        };
                    }

                    type = 'organization/createorg';
                }

                dispatch({
                    type: type,
                    payload: {
                        organization,
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
        organization: { organization },
        host: { hosts },
        } = this.props;
        const { form, submitting } = this.props;
        const { getFieldValue } = form;
        const { getFieldDecorator } = this.props.form;
        const location = this.props.location || this.context.location;
        const search = new URLSearchParams(location.search);
        const action = search.get('action') || 'create';
        const currentOrg = typeof(organization.organization) === 'undefined' ? {
            "blockchain_network_id": "",
            "ca": {
                "country": "",
                "locality": "",
                "province": ""
            },
            "description": "",
            "domain": "",
            "enableNodeOUs": true,
            "id": "",
            "name": "",
            "ordererHostnames": [],
            "peerNum": 0,
            "host_id":"",
            "type": ""
            } : organization.organization;

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
        
        const hostInfo = hosts.filter( host => host.id === currentOrg.host_id );
        const hostName = hostInfo.length > 0 ? hostInfo[0].name : '';

        const orgtypes = ['peer', 'orderer'];
        const orgtypeOptions = orgtypes.map(orgtype => (
            <Option value={orgtype}>
            <span>{orgtype}</span>
            </Option>
            ));

        const submitFormLayout = {
                wrapperCol: {
                    xs: { span: 24, offset: 0 },
                    sm: { span: 10, offset: 7 },
                },
            };

        const hosta = Array.isArray(hosts)? hosts : [];
        const hostOptions = hosta.map(host => (
            <Option key={host.id} value={host.id}>
                <span>{host.name}</span>
            </Option>
        ));

        return (
            <PageHeaderLayout
            title={action === 'edit' ? intl.formatMessage(messages.orgDetail) : intl.formatMessage(messages.orgCreate)}
            content={action === 'edit' ? intl.formatMessage(messages.orgDetailCon) : intl.formatMessage(messages.orgCreateCon)}
            logo={<Icon type="team" style={{fontSize: 30, color: '#722ed1'}} />}
            >
                <Card bordered={false}>
                    <Form onSubmit={this.handleSubmit} hideRequiredMark style={{ marginTop: 8 }}>
                        <FormItem {...formItemLayout} label={intl.formatMessage(messages.orgName)} >
                            {
                                getFieldDecorator('name', {
                                    initialValue: action === 'edit' ? currentOrg.name : '',
                                    rules: [
                                        {
                                            required: true,
                                            message: intl.formatMessage(messages.inputName),
                                        },
                                        {
                                            pattern: new RegExp("^[a-z](?:[0-9a-z\\-]*[0-9a-z])*$"),
                                            message: intl.formatMessage(messages.orgNameWarning),
                                        }
                                    ],
                                })(<Input placeholder={intl.formatMessage(messages.orgNameDesc)} disabled={action === 'edit'} />)
                            }
                        </FormItem>
                        <FormItem
                            {...formItemLayout}
                            label={<span>
                            {intl.formatMessage(messages.orgDesc)}
                            <em className={styles.optional}>
                            （{intl.formatMessage(messages.option)}）
                            </em>
                            </span>}
                        >
                            {
                                getFieldDecorator('description', {
                                initialValue: action === 'edit' ? currentOrg.description : '',
                                rules: [
                                    {
                                        required: false,
                                        message: intl.formatMessage(messages.orgInputDesc),
                                    },
                                ],
                                })(<Input placeholder = {action === 'edit' ? '' : intl.formatMessage(messages.orgInputDesc)} disabled={action === 'edit'} />)
                            }
                        </FormItem>
                        <FormItem {...formItemLayout} label="domain">
                            {
                                getFieldDecorator('domain', {
                                    initialValue: action === 'edit' ? currentOrg.domain : '',
                                    rules: [
                                        {
                                            required: true,
                                            message: intl.formatMessage(messages.orgDomainInput),
                                        },
                                        {
                                            pattern: new RegExp("^[0-9a-zA-Z](?:[a-zA-Z0-9\\-]*[a-zA-Z0-9])*\\.[a-zA-Z]+$"),
                                            message: intl.formatMessage(messages.orgDomainFormatWarning),
                                        }
                                    ],
                                    })(<Input placeholder={intl.formatMessage(messages.orgDomainExample)} disabled={action === 'edit'} />)
                            }
                        </FormItem>
                        <FormItem {...formItemLayout} label={intl.formatMessage(messages.orgTypeSelect)}>
                            {
                                getFieldDecorator('type', {
                                    initialValue: action === 'edit' ? currentOrg.type : '',
                                    rules: [
                                        {
                                            required: true,
                                            message: intl.formatMessage(messages.orgTypeSelectWarning),
                                        },
                                    ],
                                })(<Select disabled={action === 'edit'}>{orgtypeOptions}</Select>)
                            }
                        </FormItem>
                        {
                            getFieldValue('type') !== 'peer' ? '' :
                            <FormItem
                                {...formItemLayout}
                                label={intl.formatMessage(messages.orgPeerNumber)}
                            >
                                {
                                    getFieldDecorator('peerNum', {
                                        initialValue: action === 'edit' ? currentOrg.peerNum : '',
                                        rules: [
                                            {
                                                required: getFieldValue('type') === 'peer' ? 'required' : false,
                                                message: intl.formatMessage(messages.orgPeerNumberInput),
                                            },
                                            {
                                                pattern: new RegExp("^[1-9]\\d*$"),
                                                message: intl.formatMessage(messages.orgPeerNumberWarning),
                                            }
                                        ],
                                    })(<Input placeholder={intl.formatMessage(messages.orgPeerNumber)} disabled={action === 'edit'} />)
                                }
                            </FormItem>
                        }
                        <FormItem
                            {...formItemLayout}
                            label={<span>{intl.formatMessage(messages.country)}<em className={styles.optional}>（{intl.formatMessage(messages.option)}）</em></span>}
                        >
                            {
                                getFieldDecorator('country', {
                                    initialValue: action === 'edit' ? currentOrg.ca.country : '',
                                    rules: [
                                        {
                                            required: false,
                                            message: intl.formatMessage(messages.countryInput),
                                        },
                                    ],
                                })(<Input placeholder={action === 'edit' ? '' : intl.formatMessage(messages.countryInput)} disabled={action === 'edit'} />)
                            }
                        </FormItem>
                        <FormItem
                            {...formItemLayout}
                            label={<span>
                                {intl.formatMessage(messages.province)}
                            <em className={styles.optional}>（{intl.formatMessage(messages.option)}）</em>
                            </span>}
                        >
                            {
                                getFieldDecorator('province', {
                                initialValue: action === 'edit' ? currentOrg.ca.province : '',
                                rules: [
                                    {
                                        required: false,
                                        message: intl.formatMessage(messages.provinceInput),
                                    },
                                ],
                                })(<Input placeholder={action === 'edit' ? '' : intl.formatMessage(messages.provinceInput)} disabled={action === 'edit'} />)
                            }
                        </FormItem>
                        <FormItem
                            {...formItemLayout}
                            label={<span>
                                {intl.formatMessage(messages.city)}
                            <em className={styles.optional}>（{intl.formatMessage(messages.option)}）</em>
                            </span>}
                        >
                            {
                                getFieldDecorator('locality', {
                                initialValue: action === 'edit' ? currentOrg.ca.locality : '',
                                rules: [
                                    {
                                        required: false,
                                        message: intl.formatMessage(messages.cityInput),
                                    },
                                ],
                                })(<Input placeholder={action === 'edit' ? '' : intl.formatMessage(messages.cityInput)} disabled={action === 'edit'} />)
                            }
                        </FormItem>
                        {
                            getFieldValue('type') !== 'orderer' ? '' :
                            <FormItem
                                {...formItemLayout}
                                label={intl.formatMessage(messages.ordererHostnames)}
                            >
                                {
                                    getFieldDecorator('ordererHostnames', {
                                        initialValue: action === 'edit' ? currentOrg.ordererHostnames.join('\n') : '',
                                        rules: [
                                            {
                                                required: getFieldValue('type') === 'orderer' ? 'required' : false,
                                                message: intl.formatMessage(messages.ordererHostnamesInput),
                                            },
                                            {
                                                validator: this.checkHostName,
                                            }
                                        ],
                                    })
                                    (<TextArea style={{minHeight: 32}}
                                        placeholder={action === 'edit' ? '' : intl.formatMessage(messages.ordererHostnamesContent)}
                                        rows={action === 'edit' ? currentOrg.ordererHostnames.length : 4}
                                        disabled={action === 'edit'}/>)
                                }
                            </FormItem>
                        }
                        <FormItem {...formItemLayout} label={intl.formatMessage(messages.network)} style={{display: action === 'edit' ? 'block' : 'none'}}>
                            {
                                getFieldDecorator('network', {
                                initialValue: action === 'edit' ? currentOrg.networkName : '',
                                rules: [
                                    {
                                        required: false,
                                    },
                                ],
                                })(<Input disabled={true} />)
                            }
                        </FormItem>
                        <FormItem {...formItemLayout} label={intl.formatMessage(messages.host)}>
                            {getFieldDecorator('host_id', {
                                initialValue: action === 'edit' ? hostName : '',
                                rules: [
                                    {
                                        required: true,
                                        message: intl.formatMessage(messages.hostForSel),
                                    },
                                ],
                            })(<Select disabled={action === 'edit'}>{hostOptions}</Select>)}
                        </FormItem>
                        <FormItem {...submitFormLayout} style={{ marginTop: 32 }}>
                            <Button onClick={this.clickCancel} >{intl.formatMessage(messages.cancel)}</Button>
                            <Button style={{display: (action === 'edit') ? 'none' : '', marginLeft: 8}} type="primary" htmlType="submit" loading={submitting} >
                                {intl.formatMessage(messages.ok)}
                            </Button>
                        </FormItem>
                    </Form>
                </Card>
            </PageHeaderLayout>
        );
    }
}
