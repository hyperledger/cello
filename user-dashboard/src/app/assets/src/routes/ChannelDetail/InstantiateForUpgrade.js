import React, { PureComponent } from 'react';
import { Card, Form, Input, Button, Icon, Radio,Select } from 'antd';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import {defineMessages, IntlProvider} from "react-intl";
import {getLocale} from "../../utils/utils";
import {stringify} from "qs";

const {TextArea}=Input;
const FormItem = Form.Item;
const { Option } = Select;

const messages = defineMessages({
    title: {
        id: 'ChainCode.Upgrade.Title',
        defaultMessage: 'ChainCode Upgrade',
    },
    description: {
        id: 'ChainCode.Upgrade.Description',
        defaultMessage: 'Please select the target version ChainCode, initialization parameters and endorsement policies.',
    },
    chainCodeName: {
        id: 'ChainCode.Upgrade.ChainCodeName',
        defaultMessage: 'Target ChainCode Name',
    },
    chainCodeVersion: {
        id: 'ChainCode.Upgrade.ChainCodeVersion',
        defaultMessage: 'Target ChainCode Version',
    },
    chainCodeNameSel: {
        id: 'ChainCode.Upgrade.ChainCodeNameSel',
        defaultMessage: 'Please select chaincode name',
    },
    parameters: {
        id: 'ChainCode.Instantiate.Parameters',
        defaultMessage: 'Parameters',
    },
    parametersSel: {
        id: 'ChainCode.Instantiate.ParametersSel',
        defaultMessage: 'Please input Parameters',
    },
    parametersErr: {
        id: 'ChainCode.Instantiate.ParametersErr',
        defaultMessage: 'The parameters must be separated by \',\'',
    },
    parametersTips: {
        id: 'ChainCode.Instantiate.ParametersTips',
        defaultMessage: 'The parameters must be segmented using \',\',for example: a,100,b,200',
    },
    functionName: {
        id: 'ChainCode.Instantiate.FunctionName',
        defaultMessage: 'Function name',
    },
    functionNameSel: {
        id: 'ChainCode.Instantiate.FunctionNameSel',
        defaultMessage: 'Function name(Selective filling)',
    },
    operation: {
        id: 'ChainCode.Instantiate.Operation',
        defaultMessage: 'Operation',
    },
    operationAnd: {
        id: 'ChainCode.Instantiate.OperationAnd',
        defaultMessage: 'And',
    },
    operationOr: {
        id: 'ChainCode.Instantiate.OperationOr',
        defaultMessage: 'Or',
    },
    operationUserDefined: {
        id: 'ChainCode.Instantiate.OperationUserDefined',
        defaultMessage: 'User defined',
    },
    endorsementPolicy: {
        id: 'ChainCode.Instantiate.EndorsementPolicy',
        defaultMessage: 'Endorsement policies',
    },
    endorsementPolicySel: {
        id: 'ChainCode.Instantiate.EndorsementPolicySel',
        defaultMessage: 'Please choose endorsement policies by operation.',
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


@connect(({ChannelList,ChainCodeList,Identities,InstantChainCode,ChainCodeDetail,loading }) => ({
    ChannelList,
    ChainCodeList,
    ChainCodeDetail,
    Identities,
    submitting:loading.effects['InstantChainCode/instantiate'],
}))

@Form.create()
export default class InstallChainCode extends PureComponent {
    state = {
        submitting: false,
        endorsementPolicy:{},
    };
    
    componentDidMount() {
        const location = this.props.location || this.context.location;
        const search = new URLSearchParams(location.search);
        const chaincodeId = search.get('id');
        const channelId = search.get('channnelId');
        /* this.props.dispatch({
             type: 'InstantChainCode/fetch',
             payload: {
                  id:chaincodeId,
             },
         });  */
        this.props.dispatch({
            type:'ChainCodeList/fetch',
        });
        
        this.props.dispatch({
            type: 'ChainCodeDetail/fetchCCUpVer',
            payload:{
                id: chaincodeId,
            },
        });
        this.props.dispatch({
            type: 'ChainCodeDetail/fetchNet',
            payload:{
                id: chaincodeId,
            },
        });
        this.props.dispatch({
            type: 'Identities/fetchOrgMsp',
            payload: {
                channelId: channelId,   //链码ID值
            },
        });
    }
    
    clickCancel = () => {
        const location = this.props.location || this.context.location;
        const search = new URLSearchParams(location.search);
        const channelId = search.get('channnelId');
        this.props.dispatch(
            routerRedux.push({
                pathname: 'ChannelDetail',
                search: stringify({
                    id: channelId,
                })
            })
        );
    };
    handleSubmit = e => {
        e.preventDefault();
        const location = this.props.location || this.context.location;
        const search = new URLSearchParams(location.search);
        const chaincodeId = search.get('id');
        const channnelId = search.get('channnelId');
        this.props.form.validateFieldsAndScroll({ force: true }, (err, values) => {
            if (!err) {
                const upgrade={
                    channel_id:channnelId,
                    args:values.args,
                    functionName:values.functionName,
                    endorsementPolicy:JSON.parse(values.endorsementPolicy),
                };
                console.log('upgrade');
                console.log(upgrade);
                console.log("valuse.version:",values.chaincode_version);
                this.props.dispatch({
                    type: 'InstantChainCode/upgrade',
                    payload: {
                        id: values.chaincode_version,   //链码ID值
                        upgrade: upgrade,
                        
                    },
                });
            }
        });
    };
    
    onChangeOperation=(e)=>{
        const {
            Identities:{OrgRole},
        } = this.props;
        
        var signed=[];
        var policy={};
        for(let i=0;i<OrgRole.length;i++){
            signed[i]={"signed-by":i};
        }
        if(e.target.value==='1'){
            const number =`${OrgRole.length}-of`;
            policy[number]=signed;
            this.state.endorsementPolicy={
                identities: OrgRole,
                policy: policy,
            };
        }
        else if(e.target.value==='2'){
            policy={'1-of':signed};
            this.state.endorsementPolicy={
                identities: OrgRole,
                policy: policy,
            };
        }
        else{
        
        }
    };
    
    //
    // onChangeChoose=(chaincode_Ver)=>{
    //     const {
    //         ChainCodeDetail:{chaincodesMatch},
    //     } = this.props;
    //     const { dispatch } = this.props;
    //     dispatch({
    //         type: 'ChainCodeDetail/fetchChaincodeUpto',
    //         payload: {
    //             chaincode_Ver,   //链码版本
    //             chaincodesMatch,
    //         },
    //     });
    // };
    
    render() {
        const {
            ChainCodeDetail,
            submitting,
        } = this.props;
        
        const chaincodeDetail = ChainCodeDetail.chaincodes;
        const chaincodesMatch = ChainCodeDetail.chaincodesMatch;
        const {getFieldDecorator} = this.props.form;
        const allChaincodes = Array.isArray(chaincodesMatch) ? chaincodesMatch : [];    //获取通道信息选项
        const chaincodeOptions = allChaincodes.map(chaincodesMatch => (
            <Option key={chaincodesMatch.id} value={chaincodesMatch.id}>
                <span>{chaincodesMatch.version}</span>
            </Option>
        ));
        const location = this.props.location || this.context.location;
        const search = new URLSearchParams(location.search);
        const channnelId = search.get('channnelId');
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
                        <FormItem {...formItemLayout}  label={intl.formatMessage(messages.chainCodeName)}>{chaincodeDetail.name}</FormItem>
                        
                        <FormItem {...formItemLayout} label={intl.formatMessage(messages.chainCodeVersion)}>
                            {getFieldDecorator('chaincode_version', {
                                initialValue:'',
                                rules: [
                                    {
                                        required: true,
                                        message: intl.formatMessage(messages.chainCodeNameSel),
                                    },
                                ],
                            })(
                                <Select
                                    placeholder={intl.formatMessage(messages.chainCodeNameSel)}
                                    style={{maxWidth: 510, width: '100%'}}
                                >
                                    {chaincodeOptions}
                                </Select>
                            )}
                        </FormItem>
                        <FormItem {...formItemLayout}  label={intl.formatMessage(messages.parameters)} extra={intl.formatMessage(messages.parametersTips)}>
                            {getFieldDecorator('args', {
                                initialValue: '',
                                rules: [
                                    {   pattern: new RegExp("^[A-Za-z0-9]+[,A-Za-z0-9]*$"),
                                        message: intl.formatMessage(messages.parametersErr),
                                    },
                                ],
                            })(<Input placeholder={intl.formatMessage(messages.parametersSel)} />)}
                        </FormItem>
                        <FormItem {...formItemLayout}  label={intl.formatMessage(messages.functionName)} >
                            {getFieldDecorator('functionName', {
                                initialValue: '',
                                rules: [
                                    {
                                        message: intl.formatMessage(messages.operation),
                                    },
                                ],
                            })(<Input placeholder={intl.formatMessage(messages.functionNameSel)} />)}
                        </FormItem>
                        <FormItem {...formItemLayout}  label={intl.formatMessage(messages.operation)}  style={{ marginTop: 18 }}  >
                            {getFieldDecorator('operation', {
                                initialValue: '',
                            })(
                                <Radio.Group onChange={(value)=>this.onChangeOperation(value)} >
                                    <Radio style={{ fontSize: 14, marginLeft: 30 }} value="1" >{intl.formatMessage(messages.operationAnd)}</Radio>
                                    <Radio style={{fontSize: 14, marginLeft: 30 }}  value="2" >{intl.formatMessage(messages.operationOr)}</Radio>
                                    <Radio style={{fontSize: 14, marginLeft: 30 }}  value="3" >{intl.formatMessage(messages.operationUserDefined)}</Radio>
                                </Radio.Group>
                            )}
                        </FormItem>
                        <FormItem {...formItemLayout} label={intl.formatMessage(messages.endorsementPolicy)} >
                            {getFieldDecorator('endorsementPolicy', {
                                initialValue: JSON.stringify(this.state.endorsementPolicy),
                                rules: [
                                    {
                                        required: true,
                                        message: intl.formatMessage(messages.endorsementPolicySel),
                                    },
                                ],
                            })(<TextArea autosize={{minRows:8,maxRows:12}} />)}
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


