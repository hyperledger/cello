import React, { PureComponent } from 'react';
import { Card, Form, Input, Button, Row,Col,Upload, Icon, message,Select,Modal } from 'antd';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import PropTypes from 'prop-types';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import reqwest from 'reqwest';
import {defineMessages, IntlProvider} from "react-intl";
import {getLocale} from "../../utils/utils";
//import md5 from 'js-md5';

const messages = defineMessages({
    uploadDesc:{
        id: 'ChainCode.UploadChainCode.Desc',
        defaultMessage: 'Please put the uploaded ChainCode file in the folder, compress the folder into zip file and upload it.',
    },
    uploadChainCode:{
        id: 'ChainCode.UploadChainCode',
        defaultMessage: 'Upload ChainCode',
    },
    name: {
        id: 'ChainCode.UploadChainCode.Name',
        defaultMessage: 'Name',
    },
    description: {
        id: 'ChainCode.UploadChainCode.Description',
        defaultMessage: 'Description',
    },
    version: {
        id: 'ChainCode.UploadChainCode.Version',
        defaultMessage: 'Version',
    },
    versionSel:{
        id: 'ChainCode.UploadChainCode.VersionSel',
        defaultMessage: 'Please input ChainCode version',
    },
    language: {
        id: 'ChainCode.UploadChainCode.Language',
        defaultMessage: 'Code Language',
    },
    languageSel: {
        id: 'ChainCode.UploadChainCode.LanguageSel',
        defaultMessage: 'Please select Code Language',
    },
    md5Value: {
        id: 'ChainCode.UploadChainCode.Md5',
        defaultMessage: 'MD5 Value',
    },
    md5ValueSel:{
        id: 'ChainCode.UploadChainCode.Md5Sel',
        defaultMessage: 'Please input MD5 Value',
    },
    chainCodeSel: {
        id: 'ChainCode.UploadChainCode.Sel',
        defaultMessage: 'Select ChainCode file',
    },
    uploadSuccess:{
        id: 'ChainCode.UploadChainCode.Success',
        defaultMessage: 'Upload ChainCode success',
    },
    uploadFailed:{
        id: 'ChainCode.UploadChainCode.Failed',
        defaultMessage: 'Upload ChainCode failed',
    },
    nameRequire:{
        id: 'ChainCode.UploadChainCode.NameRequire',
        defaultMessage: 'The first character can only begin with letters and numbers, and the ChainCode name can only contain numbers, letters, \'_\' and \'-\'',
    },
    uploadFileRequire:{
        id: 'ChainCode.UploadChainCode.FileRequire',
        defaultMessage: 'Only uploading .zip files is allowed',
    },
    nameSel:{
        id: 'ChainCode.UploadChainCode.NameSel',
        defaultMessage: 'Please input the correct ChainCode name.',
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
@connect(({ ChainCodeList,loading }) => ({
    ChainCodeList,
    submitting : loading.effects['ChainCodeList/create'],
}))

@Form.create()
export default class NewSmartContractCode extends PureComponent {

    static contextTypes = {
        routes: PropTypes.array,
        params: PropTypes.object,
        location: PropTypes.object,
    };
    state = {
        submitting: false,
        smartContractId: '',
        smartContractCodeId: '',
        file:[],
      //  md5:'',
      //  reading:false,
    };

    submitCallback = ({ payload, success }) => {
        const { smartContractId } = this.state;
        this.setState({
            submitting: false,
        });
        if (success) {
            message.success(`Create new smart contract version ${payload.version} successfully.`);
            this.props.dispatch(
                routerRedux.push({
                    pathname: `/smart-contract/info/${smartContractId}`,
                })
            );
        } else {
            message.error(`Create new smart contract version ${payload.version} failed.`);
        }
    };

    clickCancel = () => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'ChainCodeList',
            })
        );
    };

    handleSubmit = e => {
        e.preventDefault();
        const { form, dispatch } = this.props;
        const location = this.props.location || this.context.location;
        const search = new URLSearchParams(location.search);
        const chaincodeId = search.get('id');
        const action = search.get('action') || 'create';

        form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                let chaincode={};

                if(action === 'edit')
                {
                    chaincode={
                        description:values.description,
                        id:chaincodeId,
                        callback:this.submitCallback,
                    };

                    this.props.dispatch({
                        type: 'ChainCodeList/create',
                        payload: {
                            chaincode,
                            callback: this.submitCallback,
                        },
                    })
                }
                else{
                  //  console.log('code');
                    const formData = new FormData();
                    formData.append('name', values.name);
                    formData.append('description', values.description);
                    formData.append('version', values.version);
                    formData.append('language', values.language);
                    formData.append('cc_file', this.state.file[0]);
              //      formData.append('md5', this.state.md5);
                    formData.append('md5', values.md5);
                    this.setState({submitting: true});
                    const token = `JWT ${localStorage.getItem('cello-token')}`;

                    reqwest({
                        url:'/v2/chaincodes',
                        method:'post',
                        processData: false,
                        data: formData,
                        headers:{
                            Authorization: token,
                        },
                        success: () => {
                            this.setState({
                                submitting: false
                            });
                            message.success(intl.formatMessage(messages.uploadSuccess));
                            this.props.dispatch(
                                routerRedux.push({
                                    pathname: 'ChainCodeList',
                                })
                            )
                        },

                        error: () => {
                            this.setState({
                                submitting:false
                            });
                            Modal.error({
                                title: intl.formatMessage(messages.uploadFailed)
                            });
                        }

                    });
                }
            }
        });
    };

    normFile = () => {
        return this.state.smartContractCodeId;
    };

   /*  MD5reader =(file) =>{
         const fileReader=new FileReader();
        fileReader.readAsArrayBuffer(file);
         const index = this;
        fileReader.onload =  function (e) {
         const message = e.target.result;

         const mes = new Uint8Array(message);

         const md5data =md5(mes);

         index.setState({md5:md5data,reading:false});
        };
    };   */


    render() {
        const {
            ChainCodeList: { chaincodes },
        } = this.props;
        const { getFieldDecorator } = this.props.form;
        const { submitting,smartContractCodeId, } = this.state;
        const location = this.props.location || this.context.location;
        const search = new URLSearchParams(location.search);
        const chaincodeId = search.get('id');
        const action = search.get('action') || 'create';
        const ccs = Array.isArray(chaincodes.chaincodes) ? chaincodes.chaincodes : [];
        const filterccs = ccs.filter(ccItem => `${ccItem.id}` === chaincodeId);
        const currentChaincode = filterccs.length > 0 ? filterccs[0] : {};   //编辑状态下获取当前chaincode的信息

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

        const languages = [
            {
                id: 'golang',
                name: 'golang',
            },
            {
                id: 'node',
                name: 'node',
            },
            {
                id: 'java',
                name: 'java',
            },

        ];
        


        const SelectProps = {
            onRemove: () => {
            //    this.setState({file:[],md5:''});
                this.setState({file:[]});
            },

            beforeUpload:(file) => {
              //  this.setState({file: [file],reading:true});
             //   this.MD5reader(file);
                this.setState({file: [file]});
                return false;
            },
            fileList: this.state.file
        };


        return (
            <PageHeaderLayout
                logo={<Icon type="link" style={{fontSize: 30, color: '#722ed1'}} />}
                title={ intl.formatMessage(messages.uploadChainCode) }
                content={ intl.formatMessage(messages.uploadDesc) }
            >
                <Card bordered={false}>
                    <Form onSubmit={this.handleSubmit} hideRequiredMark style={{ marginTop: 8 }}>
                        <FormItem {...formItemLayout}
                                  label= { intl.formatMessage(messages.name) }
                                  extra= { intl.formatMessage(messages.nameRequire) }
                        >
                            {getFieldDecorator('name', {
                                initialValue: '',
                                rules: [{ required: true,
                                          pattern: new RegExp("^[A-Za-z0-9][\\w-]*$"),
                                          message: intl.formatMessage(messages.nameSel),
                                }],
                            })(<Input style={{ maxWidth: 530, width: '100%' }} placeholder={ intl.formatMessage(messages.name) } disabled={action === 'edit'}/>)}
                        </FormItem>
                        <FormItem {...formItemLayout} label={intl.formatMessage(messages.description)}>
                            {getFieldDecorator('description', {
                                initialValue: '',
                                rules: [{ required: false
                                }],
                            })(<Input style={{ maxWidth: 530, width: '100%' }} placeholder= {intl.formatMessage(messages.description)}/>)}
                        </FormItem>
                        <FormItem {...formItemLayout} label={intl.formatMessage(messages.version)}>
                            {getFieldDecorator('version', {
                                initialValue: '',
                                rules: [{ required: true, message: intl.formatMessage(messages.versionSel),
                                }],
                            })(<Input style={{ maxWidth: 530, width: '100%' }} placeholder={intl.formatMessage(messages.version)} disabled={action === 'edit'}/>)}
                        </FormItem>
                        <FormItem
                            {...formItemLayout} label={intl.formatMessage(messages.language)}
                        >
                            {getFieldDecorator('language', {
                                initialValue:'golang',
                            })(
                                <Select
                                    placeholder={intl.formatMessage(messages.languageSel)}
                                >
                                    {languages.map(lang => (
                                        <Option key={lang.id} value={lang.id}>
                                            {lang.name}
                                        </Option>
                                    ))}
                                </Select>
                            )}
                        </FormItem>
                        <FormItem
                            {...formItemLayout}
                            label={intl.formatMessage(messages.md5Value)}
                        >
                            {getFieldDecorator('md5', {
                                initialValue: '',
                                rules: [{ required: true,message: intl.formatMessage(messages.md5ValueSel),
                                }],
                            })(<Input style={{ maxWidth: 530, width: '100%' }} placeholder={intl.formatMessage(messages.md5ValueSel)} />)}
                        </FormItem>
                        <FormItem
                            {...formItemLayout}
                            label={intl.formatMessage(messages.uploadChainCode)}
                            extra={intl.formatMessage(messages.uploadFileRequire)}
                            id={smartContractCodeId}
                        >
                            {getFieldDecorator('smartContractCode', {
                                getValueFromEvent: this.normFile,
                                trigger: 'onBlur',
                            })(
                                <Upload {...SelectProps}  >
                                    <Button disabled={this.state.file.length > 0}>
                                        <Icon type="upload" /> {intl.formatMessage(messages.chainCodeSel)}
                                    </Button>
                                </Upload>
                            )}
                        </FormItem>
                        { /*   <FormItem
                            {...formItemLayout}
                            label="MD5值"
                        >
                            {(<span>{action ==='edit'? currentChaincode.md5:this.state.md5}</span> )}
                        </FormItem>   */ }
                        <FormItem {...submitFormLayout} style={{ marginTop: 32 }}>
                            <Button onClick={this.clickCancel}>
                                {intl.formatMessage(messages.cancel)}
                            </Button>
                            <Button loading={submitting} type="primary" htmlType="submit" style={{ marginLeft: 10 }}>
                            { /*  <Button loading={submitting} disbale={this.state.reading}  type="primary" htmlType="submit" style={{ marginLeft: 10 }}>  */ }
                                {intl.formatMessage(messages.submit)}
                            </Button>
                        </FormItem>
                    </Form>
                </Card>
            </PageHeaderLayout>
        );
    }
}


