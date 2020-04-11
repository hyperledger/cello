import React, { PureComponent } from 'react';
import { Card, Form, Input, Button,Select,Icon,Tree,Modal,message,Col } from 'antd';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import PropTypes from 'prop-types';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import StandardFormRow from '../../components/StandardFormRow';
import {defineMessages, IntlProvider} from "react-intl";
import {getLocale} from "../../utils/utils";

const FormItem = Form.Item;
const {TreeNode}=Tree;
const { Option } = Select;

const messages = defineMessages({
    createDepartment:{
        id: 'User.NewDep.CreateDepartment',
        defaultMessage: 'Create Department',
    },
    newDepartment:{
        id: 'User.NewDep.NewDepartment',
        defaultMessage: 'New Department',
    },
    addDepartment:{
        id: 'User.NewDep.AddDepartment',
        defaultMessage: 'New department',
    },
    modDepartment:{
        id: 'User.ModDep.ModDepartment',
        defaultMessage: 'Modify Department',
    },
    oldDepartment:{
        id: 'User.ModDep.OldDepartment',
        defaultMessage: 'Original Department',
    },
    newlyDepartment:{
        id: 'User.ModDep.ModDepartment',
        defaultMessage: 'New Department',
    },
    modDepartmentMsg:{
        id: 'User.ModDep.ModDepartmentMsg',
        defaultMessage: 'Please amend the Department',
    },
    userName:{
        id: 'User.NewUser.UserName',
        defaultMessage: 'User Name',
    },
    selectUser:{
        id: 'User.NewUser.EnterUserName',
        defaultMessage: 'Please enter the user name',
    },
    inputUser:{
        id: 'User.NewUser.InputUser',
        defaultMessage: 'Enter the user name',
    },
    role:{
        id: 'User.NewUser.Role',
        defaultMessage: 'Role',
    },
    selectRole:{
        id: 'User.NewUser.SelectRole',
        defaultMessage: 'Please select user role',
    },
    department:{
        id: 'User.NewUser.Department',
        defaultMessage: 'Department',
    },
    selectDepartment:{
        id: 'User.NewUser.SelectDepartment',
        defaultMessage: 'Please select user department',
    },
    create:{
        id: 'User.NewUser.Create',
        defaultMessage: 'Create',
    },
    modify:{
        id: 'User.NewUser.Modify',
        defaultMessage: 'Modify',
    },
    password:{
        id: 'User.NewUser.Password',
        defaultMessage: 'Password',
    },
    inputPassword:{
        id: 'User.NewUser.InputPassword',
        defaultMessage: 'Please enter the password',
    },
    rePassword:{
        id: 'User.NewUser.RePassword',
        defaultMessage: 'Confirm Password',
    },
    reinputPassword:{
        id: 'User.NewUser.ReInputPassword',
        defaultMessage: 'Please enter the password',
    },
    createUser:{
        id: 'User.NewUser.CreateUser',
        defaultMessage: 'Create User',
    },
    description:{
        id: 'User.NewUser.Description',
        defaultMessage: 'When creating a user, you can specify the role and department of the new user by yourself.After the creation ,you need to notify the new user to log in and change the password.',
    },
    alreadyExist:{
        id: 'User.Error.AlreadyExist',
        defaultMessage: 'The organization or department already exists!',
    },
    passwordsDiff:{
        id: 'User.Error.PasswordsDiff',
        defaultMessage: 'Two passwords are different!',
    },
    administrator:{
        id: 'User.NewUser.Administrator',
        defaultMessage: 'Administrator',
    },
    operator:{
        id: 'User.NewUser.Operator',
        defaultMessage: 'Operator',
    },
    cancel:{
        id: 'User.NewUser.Cancel',
        defaultMessage: 'Cancel',
    },
    submit:{
        id: 'User.NewUser.Submit',
        defaultMessage: 'Ok',
    },
    sso:{
        id: 'User.SSOUser',
        defaultMessage: 'SSO User',
    }
});

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();


const CreateForm = Form.create()(props => {
    const { modalVisible,
        form,
        handleModalVisible,
        handleAdd,
        needAddValue,
        
        
    } = props;
    
    const okHandle = () => {
        form.validateFields((err, fieldsValue) => {
            if (err) return;
            form.resetFields();
            handleAdd(fieldsValue);
        });
    };
    
    let newAffData='';
    
    if(needAddValue){
        newAffData=needAddValue+'. '+' ';
    }
    else{
        newAffData=needAddValue+' ';
    }
    
    return (!modalVisible ? null :
            <Modal
                title={ intl.formatMessage(messages.createDepartment) }
                visible={modalVisible}
                onOk={okHandle}
                onCancel={() => handleModalVisible()}
            >
                <FormItem
                    labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} label={ intl.formatMessage(messages.newDepartment) } >
                    {form.getFieldDecorator('Aff', {
                        initialValue: '',
                    })(<div>
                            <span>{newAffData}</span>
                            <Input style={{ width: 'auto'}} placeholder={ intl.formatMessage(messages.addDepartment) }/>
                        </div>
                    )}
                </FormItem>
            </Modal>
    );
});


const CreateEditForm = Form.create()(props => {
    const { modalVisible,
        form,
        handleModalVisible,
        handleEdit,
        needAddValue,
    } = props;
    
    
    const okHandle = () => {
        form.validateFields((err, fieldsValue) => {
            if (err) return;
            form.resetFields();
            handleEdit(fieldsValue);
        });
    };
    
    return (!modalVisible ? null :
            <Modal
                title={ intl.formatMessage(messages.modDepartment) }
                visible={modalVisible}
                onOk={okHandle}
                onCancel={() => handleModalVisible()}
            >
                <FormItem
                    labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} label={ intl.formatMessage(messages.oldDepartment) } >
                    {form.getFieldDecorator('Before', {
                        initialValue: needAddValue,
                    })(<Input style={{ width: '100%'}} value={needAddValue} disabled/>
                    )}
                </FormItem>
                <FormItem
                    labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} label={ intl.formatMessage(messages.newlyDepartment) } >
                    {form.getFieldDecorator('Aff', {
                        initialValue: needAddValue,
                    })(<Input style={{ width: '100%'}} placeholder={ intl.formatMessage(messages.modDepartmentMsg) }  />
                    )}
                </FormItem>
            </Modal>
    );
});



@connect(({OrgUserList,loading }) => ({
    OrgUserList,
    loading: loading.models.OrgUserList,
    submitting: loading.effects['OrgUserList/createOrgUser'],
}))
@Form.create()
export default class extends PureComponent {
    state = {
        modalVisible: false,
        modalVisibleEDT: false,
        AffGather:[],
        needAddValue:'',
        
    };
    
    componentWillMount() {
        this.props.dispatch({
            type: 'OrgUserList/getAffiliation',
        });
    }
    
    clickCancel = () => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'OrgUserList',
            })
        );
    };
    
    
    handleEdit =(fields) =>{
        
        const affBefore=fields.Before;
        const affEdit=fields.Aff;
        
        this.props.dispatch({
            type:    'OrgUserList/updateAffiliation',
            payload:  {
                affiliation:{
                    sourceName:affBefore,
                    targetName:affEdit,
                },
            },
        });
        
        
        const list = this.state.AffGather;
        /*    const index=list.indexOf(affBefore);

            list.splice(index,1,affEdit);
             */
        this.setState({
            modalVisibleEDT: false,
            AffGather: list,
            needAddValue:affEdit,
        });
        
    };
    
    
    handleAdd = (fields) => {
        
        let  AffData='' ;
        if(this.state.needAddValue){
            AffData=this.state.needAddValue+'.'+fields.Aff;
        }
        else{
            AffData=fields.Aff;
        }
        if(this.state.AffGather.indexOf(AffData) !== -1)
        {
            
            message.error( intl.formatMessage(messages.alreadyExist) );
            return;
        }
        
        const list = this.state.AffGather;
        list.push(AffData);
        
        this.props.dispatch({
            type:    'OrgUserList/createAffiliation',
            payload:  {
                AffData:AffData,
            },
        });
        
        this.setState({
            modalVisible: false,
            AffGather: list,
            needAddValue:AffData,
        });
    };
    
    AffiliationSelect = (value)=> {
        this.setState({
            needAddValue: value.toString(),
        });
        
    };
    
    
    handleSubmit = e => {
        const {
            OrgUserList:{getAffili},
        }=this.props;
        const org=window.username.split('@');
        const orgDomain='@'+org[1];
        e.preventDefault();
        this.props.form.validateFieldsAndScroll({ force: true }, (err, values) => {
            if (!err) {
                if(values.password===values.rePassword){
                    const orguser = {
                        "name":          values.name+orgDomain,
                        "role":          values.role ,
                        "password":      values.password,
                        "delegateRoles": values.role ,
                        "affiliation":   values.affiliation,
                        "affiliationMgr": "true",
                        "revoker":        "true",
                        "gencrl":         "true",
                        
                    };
                    
                    if (window.localStorage["cello-authority"] === "admin") {
                        orguser.SSOUser = values.SSOUser;
                    }
                    else {
                        orguser.SSOUser = '';
                    }
                    
                    this.props.dispatch({
                        type:    'OrgUserList/createOrgUser',
                        payload:  {
                            orguser:orguser,
                        },
                    });
                }
                else{
                    message.success(intl.formatMessage(messages.passwordsDiff));
                }
                
            }
        });
    };
    
    
    
    handleModalVisible = (flag) => {
        this.setState({
            modalVisible: !!flag,
        });
    };
    
    handleModalVisibleEDT = (flag) => {
        this.setState({
            modalVisibleEDT: !!flag,
        });
    };
    
    render() {
        const {
            OrgUserList:{getAffili},
            submitting,
        }=this.props;
        const {getFieldDecorator} = this.props.form;
        
        const {
            modalVisible,
            modalVisibleEDT,
            AffGather,
        } = this.state;
        
        const AffSelect= Array(getAffili)? getAffili:[] ;
        this.state.AffGather=AffSelect;
        
        const parentMethods = {
            handleAdd: this.handleAdd,
            handleModalVisible: this.handleModalVisible,
            ModalVisible:this.modalVisible,
            onChange:this.onChange,
            needAddValue:this.state.needAddValue,
        };
        
        const parentMethodsEDT = {
            handleEdit: this.handleEdit,
            handleModalVisible: this.handleModalVisibleEDT,
            ModalVisible:this.modalVisibleEDT,
            onChange:this.onChange,
            needAddValue:this.state.needAddValue,
        };
        
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
        
        const OrgRole = [
            {
                id: 'org_admin',
                name:  intl.formatMessage(messages.administrator) ,
            },
            {
                id: 'org_user',
                name:  intl.formatMessage(messages.operator) ,
            },
        
        ];
        
        const org=window.username.split('@');
        const orgDomain='@'+org[1];
        
        
        return (
            <PageHeaderLayout
                title={ intl.formatMessage(messages.createUser) }
                content={ intl.formatMessage(messages.description)}
                logo={<Icon type="user" style={{fontSize: 30, color: '#722ed1'}} />}
            >
                <Card bordered={false}>
                    <Form onSubmit={this.handleSubmit} hideRequiredMark style={{marginTop: 8}}>
                        <FormItem
                            {...formItemLayout}
                            label={ intl.formatMessage(messages.userName) }
                        >
                            {getFieldDecorator('name', {
                                initialValue: '',
                                rules: [
                                    {
                                        required: true,
                                        message:  intl.formatMessage(messages.selectUser) ,
                                    },
                                ],
                            })(<div >
                                <Input style={{ width: '30%'}} placeholder={ intl.formatMessage(messages.inputUser) }/>
                                <span>{orgDomain}</span>
                            </div>)}
                        </FormItem>
                        <FormItem {...formItemLayout} label={ intl.formatMessage(messages.role) }>
                            {getFieldDecorator('role', {
                                initialValue: '',
                                rules: [
                                    {
                                        required: true,
                                        message: intl.formatMessage(messages.selectRole),
                                    },
                                ],
                            })(
                                <Select
                                    placeholder={ intl.formatMessage(messages.selectRole) }
                                >
                                    {OrgRole.map(OrgRole => (
                                        <Option key={OrgRole.id} value={OrgRole.id}>
                                            {OrgRole.name}
                                        </Option>
                                    )) }
                                </Select >
                            
                            )}
                        </FormItem>
                        <FormItem {...formItemLayout} label={ intl.formatMessage(messages.department) }>
                            {getFieldDecorator('affiliation', {
                                initialValue: this.state.needAddValue,
                            })(
                                <div>
                                    <Select
                                        placeholder={ intl.formatMessage(messages.selectDepartment) }
                                        onSelect={(value)=>this.AffiliationSelect(value)}
                                        value={this.state.needAddValue}
                                    >
                                        {AffGather.map(AffGather => (
                                            <Option  value={AffGather}>
                                                {AffGather}
                                            </Option>
                                        ))}
                                    </Select >
                                    {window.localStorage["cello-authority"] === "operator" ? "" :
                                        <div>
                                            <Button onClick={() => this.handleModalVisible(true)}>
                                                { intl.formatMessage(messages.create) }
                                            </Button>
                                            < Button onClick={() => this.handleModalVisibleEDT(true)} style={{marginLeft: 10}}>
                                                { intl.formatMessage(messages.modify) }
                                            </Button>
                                        </div>
                                    }
                                </div>
                            )}
                        </FormItem>
                        <FormItem {...formItemLayout} label={ intl.formatMessage(messages.password) }>
                            
                            {getFieldDecorator('password', {
                                rules: [
                                    {
                                        required: true,
                                        message: intl.formatMessage(messages.inputPassword),
                                    },
                                ],
                            })(<Input type="password" style={{maxWidth: 515, width: '100%'}} placeholder={ intl.formatMessage(messages.inputPassword) }/>)}
                        
                        </FormItem>
                        <FormItem {...formItemLayout} label={ intl.formatMessage(messages.rePassword) }>
                            
                            {getFieldDecorator('rePassword', {
                                rules: [
                                    {
                                        required: true,
                                        message: intl.formatMessage(messages.reinputPassword),
                                    },
                                ],
                            })(<Input type="password" style={{maxWidth: 515, width: '100%'}} placeholder={ intl.formatMessage(messages.reinputPassword) }/>)}
                        
                        </FormItem>
                        {
                            window.localStorage["cello-authority"] === "admin" &&
                            <FormItem {...formItemLayout} label={ intl.formatMessage(messages.sso) }>
                                
                                {getFieldDecorator('SSOUser', {
                                })(<Input style={{maxWidth: 515, width: '100%'}} placeholder={ intl.formatMessage(messages.sso) }/>)}
                            
                            </FormItem>
                        }
                        <FormItem {...submitFormLayout} style={{marginTop: 32}}>
                            <Button onClick={this.clickCancel}>
                                { intl.formatMessage(messages.cancel) }
                            </Button>
                            <Button loading={submitting} type="primary" htmlType="submit" style={{marginLeft: 10}}>
                                { intl.formatMessage(messages.submit) }
                            </Button>
                        </FormItem>
                    </Form>
                </Card>
                <CreateForm {...parentMethods} modalVisible={modalVisible} />
                <CreateEditForm {...parentMethodsEDT} modalVisible={modalVisibleEDT} />
            </PageHeaderLayout>
        );
    };
}


