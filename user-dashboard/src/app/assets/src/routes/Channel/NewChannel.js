import React, { PureComponent } from 'react';
import { Card, Form, Input, Button,Select,Icon } from 'antd';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import StandardFormRow from '../../components/StandardFormRow';
import styles from './ChannelList.less';
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from "../../utils/utils";

const messages = defineMessages({
    pageTitle: {
        id: 'Channel.Create.pageTitle',
        defaultMessage: 'Create Channel',
    },
    pageDesc: {
        id: 'Channel.Create.pageDesc',
        defaultMessage: 'Channel names or descriptions can be added to business-specific information for subsequent use.',
    },
    labelName: {
        id: 'Channel.Create.labelName',
        defaultMessage: 'Name',
    },
    labelNameWarning: {
        id: 'Channel.Create.labelNameWarning',
        defaultMessage: 'Please enter the correct name',
    },
    labelNameInfo: {
        id: 'Channel.Create.labelNameInfo',
        defaultMessage: 'Please enter name',
    },
    labelNameRule: {
        id: 'Channel.Create.labelNameRule',
        defaultMessage: 'Name begin with lowercase letters and only contain lowercase letters,numbers and "-"',
    },
    labelDesc: {
        id: 'Channel.Create.labelDesc',
        defaultMessage: 'Description',
    },
    labelOption: {
        id: 'Channel.Create.labelOption',
        defaultMessage: '(option)',
    },
    labelDescInfo: {
        id: 'Channel.Create.labelDescInfo',
        defaultMessage: 'Please enter...',
    },
    labelOrderOrg: {
        id: 'Channel.Create.labelOrderOrg',
        defaultMessage: 'Choose the orderer organization',
    },
    labelOrderOrgWarning: {
        id: 'Channel.Create.labelOrderOrgWarning',
        defaultMessage: 'Please choose the orderer organization',
    },
    labelPeerOrg: {
        id: 'Channel.Create.labelPeerOrg',
        defaultMessage: 'Choose the peer organization',
    },
    labelPeerOrgWarning: {
        id: 'Channel.Create.labelPeerOrgWarning',
        defaultMessage: 'Please choose the peer organization',
    },
    buttonCancel: {
        id: 'Channel.Create.ButtonCancel',
        defaultMessage: 'Cancel',
    },
    buttonOk: {
        id: 'Channel.Create.ButtonOk',
        defaultMessage: 'Ok',
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

@connect(({ChannelList, organization,loading }) => ({
    ChannelList,
    organization,
    loading:loading.models.organization,
    submitting: loading.effects['ChannelList/create'],
}))
@Form.create()
export default class NewChannel extends PureComponent {
    
    componentWillMount() {
        this.props.dispatch({
            type: 'organization/fetch',      // 获取创建通道时各个字段的选项信息
        });
    }
    
    clickCancel = () => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'ChannelList',
            })
        );
    };
    
    handleSubmit = e => {
        e.preventDefault();
        this.props.form.validateFieldsAndScroll({ force: true }, (err, values) => {
            if (!err) {
                const channel = {
                    "name": values.name,
                    "description": values.description ,
                    "orderer_url": values.orderer_url,
                    "peer_orgs": values.peer_orgs,
                };
                
                this.props.dispatch({
                    type: 'ChannelList/create',
                    payload: {
                        channel,
                        callback: this.submitCallback,
                    },
                });
                //     window.history.back();
            }
        });
    };
    
    /*static contextTypes = {
        routes: PropTypes.array,
        params: PropTypes.object,
        location: PropTypes.object,
    };  */
    
    render() {
        const {
            organization : {organization},
            submitting,
        }=this.props;
        const {getFieldDecorator} = this.props.form;
        
        const formItemLayout = {
            labelCol: {
                xs: {span: 24},
                sm: {span: 7},
            },
            wrapperCol: {
                xs: {span: 24},
                sm: {span: 12},
                md: {span: 10},
            },
        };
        
        const submitFormLayout = {
            wrapperCol: {
                xs: {span: 24, offset: 0},
                sm: {span: 10, offset: 14},
            },
        };
        
        const orgs = Array.isArray(organization.organizations) ? organization.organizations : [];  // 从8080后台获取到的组织列表
        const peerorgs = orgs.filter(orgItem => (orgItem.type === 'peer' ));   //筛选出peer类型的组织
        const orgpeerOptions = peerorgs.map(peerorg => (     // 将peer组织数组映射成选项
            <Option key={peerorg.id} value={peerorg.id}>
                <span>{peerorg.name}</span>
            </Option>
        ));
        
        const ordererorgs = orgs.filter(orgItem => (orgItem.type === 'orderer'));  //筛选出orderer类型的组织
        const orgordererOptions = ordererorgs.map(ordererorg => (        //将orderer组织数组映射成选项  value值传递时需要带domain信息
            <Option key={ordererorg.id} value={ordererorg.ordererHostnames[0] +'.'+ ordererorg.domain}>
                <span>{ordererorg.name}</span>
            </Option>
        ));
        
        
        return (
            <PageHeaderLayout
                title={intl.formatMessage(messages.pageTitle)}
                content={intl.formatMessage(messages.pageDesc)}
                logo={<Icon type="share-alt" style={{fontSize: 30, color: '#722ed1'}} />}
            >
                <Card bordered={false}>
                    <Form onSubmit={this.handleSubmit} hideRequiredMark style={{marginTop: 8}}>
                        <FormItem
                            {...formItemLayout}
                            label={intl.formatMessage(messages.labelName)}
                            extra={intl.formatMessage(messages.labelNameRule)}
                        >
                            {getFieldDecorator('name', {
                                rules: [{required: true,
                                    pattern: new RegExp("^[a-z][\\da-z-]*$"),
                                    message: intl.formatMessage(messages.labelNameWarning)}],
                            })(<Input style={{maxWidth: 515, width: '100%'}} placeholder={intl.formatMessage(messages.labelNameInfo)}/>)}
                        </FormItem>
                        <FormItem {...formItemLayout}
                                  label={<span>
                                  {intl.formatMessage(messages.labelDesc)}
                                      <em className={styles.optional}>
                                    {intl.formatMessage(messages.labelOption)}
                                </em>
                              </span>}
                        >
                            {getFieldDecorator('description', {
                                initialValue: '',
                                rules: [{required: false, message: 'Please input some description...'}],
                            })(<Input style={{maxWidth: 515, width: '100%'}} placeholder={intl.formatMessage(messages.labelDescInfo)} />)}
                        </FormItem>
                        <FormItem {...formItemLayout} label={intl.formatMessage(messages.labelOrderOrg)} >
                            {getFieldDecorator('orderer_url', {
                                initialValue: '',
                                rules: [
                                    {
                                        required: true,
                                        message: intl.formatMessage(messages.labelOrderOrgWarning),
                                    },
                                ],
                            })(
                                <Select>
                                    {orgordererOptions}
                                </Select >
                            )}
                        </FormItem>
                        <FormItem {...formItemLayout} label={intl.formatMessage(messages.labelPeerOrg)}>
                            {getFieldDecorator('peer_orgs', {
                                rules: [
                                    {
                                        required: true,
                                        message: intl.formatMessage(messages.labelPeerOrgWarning),
                                    },
                                ],
                            })(
                                <Select mode="multiple">
                                    {orgpeerOptions}
                                </Select>
                            )}
                        </FormItem>
                        <FormItem {...submitFormLayout} style={{marginTop: 32}}>
                            <Button onClick={this.clickCancel}>
                                {intl.formatMessage(messages.buttonCancel)}
                            </Button>
                            <Button loading={submitting} type="primary" htmlType="submit" style={{marginLeft: 10}}>
                                {intl.formatMessage(messages.buttonOk)}
                            </Button>
                        </FormItem>
                    </Form>
                </Card>
            </PageHeaderLayout>
        );
    };
}


