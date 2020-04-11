import React, { Component,Fragment } from 'react';
import {
    Card,
    Button,
    Form,
    Col,
    Input,
    Radio,
    message,
} from 'antd';
import StandardTableInstantList from '../../components/StandardTableInstantList';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import StandardFormRow from '../../components/StandardFormRow';
import styles from './ChannelDetail.less';
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from "../../utils/utils";
import {Divider, Dropdown, Icon, Menu} from "antd/lib/index";
import {stringify} from "qs";

const messages = defineMessages({
    pageTitle: {
        id: 'Channel.Detail.ChainCode.pageTitle',
        defaultMessage: 'Instantiated Chain Code',
    },
    colSel: {
        id: 'Channel.Detail.ChainCode.colSel',
        defaultMessage: 'Select',
    },
    colChainCode: {
        id: 'Channel.Detail.ChainCode.colChainCode',
        defaultMessage: 'Chain Code Name',
    },
    colDescription: {
        id: 'Channel.Detail.ChainCode.colDescription',
        defaultMessage: 'Description',
    },
    colCreator: {
        id: 'Channel.Detail.ChainCode.colCreator',
        defaultMessage: 'Creator',
    },
    colVersion: {
        id: 'Channel.Detail.ChainCode.colVersion',
        defaultMessage: 'Version',
    },
    colMD5: {
        id: 'Channel.Detail.ChainCode.colMD5',
        defaultMessage: 'MD5',
    },
    colUpgrade: {
        id: 'Channel.Detail.ChainCode.colUpgrade',
        defaultMessage: 'Upgrade',
    },
    labelOperation: {
        id: 'Channel.Detail.ChainCode.labelOperation',
        defaultMessage: 'Operation',
    },
    labelFucName: {
        id: 'Channel.Detail.ChainCode.labelFucName',
        defaultMessage: 'Function Name',
    },
    labelFucNameWarning: {
        id: 'Channel.Detail.ChainCode.labelFucNameWarning',
        defaultMessage: 'Please enter the function name',
    },
    labelParameter: {
        id: 'Channel.Detail.ChainCode.labelParameter',
        defaultMessage: 'Parameter',
    },
    labelParameterInput: {
        id: 'Channel.Detail.ChainCode.labelParameterInput',
        defaultMessage: 'Please enter the parameter',
    },
    labelParameterWarning: {
        id: 'Channel.Detail.ChainCode.labelParameterWarning',
        defaultMessage: 'Please enter the correct parameter',
    },
    labelParameterRule: {
        id: 'Channel.Detail.ChainCode.labelParameterRule',
        defaultMessage: 'The parameters must be separated by ",",without spaces',
    },
    buttonOk: {
        id: 'Channel.Detail.ChainCode.buttonOk',
        defaultMessage: 'Ok',
    },
    buttonBack: {
        id: 'Channel.Detail.ChainCode.buttonBack',
        defaultMessage: 'Back',
    },
    result: {
        id: 'Channel.Detail.ChainCode.result',
        defaultMessage: 'Result',
    },
    chainCodeWarning: {
        id: 'Channel.Detail.ChainCode.chainCodeWarning',
        defaultMessage: 'Please select the chain code to execute first',
    },
});

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();
const FormItem = Form.Item;

@connect(({ InstantChainCode,ChannelInstant,loading }) => ({
    InstantChainCode,
    ChannelInstant,
    loading: loading.models.InstantChainCode,
    submitting:loading.effects['ChannelInstant/operate']
}))

@Form.create()
export default class Chaincode extends Component {
    state = {
        operationKey: 'newOperations',    //query invoke choose
        selectedRows: [],         //list choose
        result:'',
    };
    
    componentDidMount() {
        const { dispatch, channelId } = this.props;
        dispatch({
            type: 'InstantChainCode/fetchInstantCC',
            payload:{
                id:channelId,
            }
        });
        
    }
    
    
    clickCancel = () => {
        const {
            ChannelInstant: {InstantList},    //  获取实例化后的链码列表
        } = this.props;
        InstantList.result='';
        this.props.dispatch(
            routerRedux.push({
                pathname: 'ChannelList',
            })
        );
    };
    
    
    
    handleInstantSubmit = e => {
        
        const { dispatch,channelId } = this.props;
        const { selectedRows} = this.state;
        const selectedRows_id =selectedRows.map(row => row.id).join(',');
        
        e.preventDefault();
        this.props.form.validateFieldsAndScroll({ force: true }, (err, values) => {
            if (!err) {
                if(selectedRows_id)   {
                    const chaincode_operation = {
                        chaincodeId: selectedRows_id,
                        operation: values.operation,
                        functionName: values.functionName.replace(/(^\s*)|(\s*$)/g, ""),
                        args: values.args,
                    };
                    
                    dispatch({
                        type: 'ChannelInstant/operate',
                        payload: {
                            channel_id: channelId,
                            chaincode_operation,
                        },
                        
                    });
                }
                else{
                    message.error(intl.formatMessage(messages.chainCodeWarning));
                }
            }
        });
    };
    
    
    handleSelectRows = rows => {
        this.setState({
            selectedRows: rows,
        });
    };
    
    
    cleanMessage =()=>{
        this.props.form.resetFields();
    };
    
    onChainCodeUpgrade =(row) => {
        const { dispatch,channelId } = this.props;
        this.props.dispatch(
            routerRedux.push({
                pathname: 'InstantiateForUpgrade',
                search: stringify({
                    id: row.id,
                    channnelId: channelId,
                })
            })
        )
    };
    
    render() {
        const {
            form: { getFieldDecorator },
            InstantChainCode:{Instant},
            ChannelInstant: {InstantList},    //  获取实例化后的链码列表
            loading,
            submitting,
        } = this.props;
        
        
        const {
            selectedRows,
            modalVisible,
        } = this.state;
        
        
        let result = InstantList.result;
        let resInfo;
        if (typeof result !== 'undefined' && result !== null && result !== '') {
             console.log("result",result);
             console.log('indexOf',result.indexOf('\u0000'));
            if(result.indexOf('\u0000') !== -1) {
                result = result.replace(/\u0000/g, '');
            }
            // let index0 = resultNew.indexOf(']');
            // let resultNew0 = resultNew.slice(0,index0+1);
            // console.log('resultNew0',resultNew);
            // const temp = [ resultNew0 ];
            // console.log("temp",temp);
            console.log(result);
            const temp = [ result ];
            resInfo = JSON.parse(temp.join());
        }
        console.log("resInfo",resInfo);
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
        
        
        const Instants = Array.isArray(Instant) ? Instant : [];
        
        const codeColumns = [
            {
                title: intl.formatMessage(messages.colChainCode),
                dataIndex: 'name',
                key: 'name',
            },
            {
                title: intl.formatMessage(messages.colDescription),
                dataIndex: 'description',
            },
            {
                title: intl.formatMessage(messages.colCreator),
                dataIndex: 'creator_name',
            },
            {
                title: intl.formatMessage(messages.colVersion),
                dataIndex: 'version',
                key: 'version',
            },
            {
                title: intl.formatMessage(messages.colMD5),
                dataIndex: 'md5',
                key: 'md5',
            },
            {
                title: "",
                render:  (row) => (
                    <Fragment>
                        {window.localStorage["cello-authority"] === "operator" ? "" :
                            <a size='small' type="primary" onClick={() => this.onChainCodeUpgrade(row)}>{intl.formatMessage(messages.colUpgrade)}</a>
                        }
                    </Fragment>
                ),
            },
        ];
        
        return (
            <Fragment>
                <StandardFormRow>
                    <Card
                        title={intl.formatMessage(messages.pageTitle)}
                        bordered={false}
                    >
                        <Form onSubmit={this.handleInstantSubmit}>
                            <div className={styles.tableList}>
                                <div className={styles.tableListOperator}>
                                    <StandardTableInstantList
                                        pagination={false}
                                        loading={loading}
                                        columns={codeColumns}
                                        data={{Instants}}
                                        selectedRows={selectedRows}
                                        onSelectRow={this.handleSelectRows}
                                        select={intl.formatMessage(messages.colSel)}
                                    />
                                </div>
                                <Card   bordered={false} >
                                    <div className={styles.tableListForm}>
                                        <Col  style={{ maxWidth: 500,}}  >
                                            <FormItem {...formItemLayout}  label={intl.formatMessage(messages.labelOperation)}  style={{ marginTop: 18 }}  >
                                                {getFieldDecorator('operation', {
                                                    initialValue: '',
                                                    rules: [
                                                        {
                                                            required: true,
                                                        },
                                                    ],
                                                })(
                                                    <Radio.Group >
                                                        <Radio style={{ fontSize: 18, marginLeft: 30 }} value="invoke"  onClick={this.cleanMessage}>invoke</Radio>
                                                        <Radio style={{fontSize: 18, marginLeft: 30 }}  value="query"   onClick={this.cleanMessage}>query</Radio>
                                                    </Radio.Group>
                                                )}
                                            </FormItem>
                                            <FormItem
                                                {...formItemLayout}
                                                label={intl.formatMessage(messages.labelFucName)}
                                                style={{ marginTop: 18 }}
                                            
                                            >
                                                {getFieldDecorator('functionName', {
                                                    initialValue: '',
                                                    rules: [
                                                        {
                                                            required: true,
                                                            message: intl.formatMessage(messages.labelFucNameWarning),
                                                        },
                                                    ],
                                                })(<Input style={{ maxWidth: 450, width: '100%' }} placeholder={intl.formatMessage(messages.labelFucNameWarning)} />)}
                                            </FormItem>
                                            <FormItem
                                                {...formItemLayout}
                                                label={intl.formatMessage(messages.labelParameter)}
                                                extra={intl.formatMessage(messages.labelParameterRule)}
                                                style={{ marginTop: 18 }}
                                            
                                            >
                                                {getFieldDecorator('args', {
                                                    initialValue: '',
                                                    rules: [
                                                        {
                                                            required: true,
                                                            /*pattern:  new RegExp("^[A-Za-z0-9]+[,A-Za-z0-9-]*$"),*/
                                                            message: intl.formatMessage(messages.labelParameterWarning),
                                                        },
                                                    ],
                                                })(<Input
                                                    style={{ maxWidth: 450, width: '100%' }}
                                                    placeholder={intl.formatMessage(messages.labelParameterInput)} />)}
                                            </FormItem>
                                            <span className={styles.submitButtons}>
                              <Button type="primary" htmlType="submit"  loading={submitting}>
                                  {intl.formatMessage(messages.buttonOk)}
                              </Button>
                            </span>
                                        </Col>
                                    </div>
                                </Card>
                            </div>
                        </Form>
                        <Card
                            title={intl.formatMessage(messages.result)}
                            bordered={false}
                            style={{ marginTop: 10 }}
                            bodyStyle={{ padding: '8px 32px 32px 32px' }}
                            loading={submitting}
                        >
                            {Array.isArray(resInfo) ? resInfo.map(item => (<div style={{wordBreak: 'break-word'}}>{JSON.stringify(item)}</div>)) : <div style={{wordBreak: 'break-word'}}>{JSON.stringify(resInfo)}</div>}
                        </Card>
                    </Card>
                </StandardFormRow>
                
                <Button icon="rollback" type="primary" style={{ marginTop: 50, marginLeft: 10  }} onClick={this.clickCancel}>
                    {intl.formatMessage(messages.buttonBack)}
                </Button>
            </Fragment>
        );
    }
}
