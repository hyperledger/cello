import React, { PureComponent, Fragment } from 'react';
import { Resizable } from 'react-resizable';
import { connect, } from 'dva';
import { routerRedux } from 'dva/router';
import {
    Card,
    Form,
    Button,
    Divider,
    Table,
    Icon,
    Modal,
    Switch,
    Input,
    Dropdown,
    Menu
} from 'antd';
import { stringify } from 'qs';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import Ellipsis from '../../components/Ellipsis'
import styles from './OrgUserList.less';
import {defineMessages, IntlProvider} from "react-intl";
import {getLocale} from "../../utils/utils";
import {message} from "antd/lib/index";

const messages = defineMessages({
    updateUser:{
        id: 'User.UpUser.UpdateUser',
        defaultMessage: 'Update User',
    },
    userName:{
        id: 'User.UpUser.UserName',
        defaultMessage: 'User Name',
    },
    userState:{
        id: 'User.UpUser.State',
        defaultMessage: 'State',
    },
    name:{
        id: 'User.UserName',
        defaultMessage: 'User Name',
    },
    role:{
        id: 'User.UserRole',
        defaultMessage: 'Role',
    },
    relationship:{
        id: 'User.Relationship',
        defaultMessage: 'Department',
    },
    sso:{
        id: 'User.SSOUser',
        defaultMessage: 'SSO User',
    },
    setSSO:{
        id: 'User.setSSOUser',
        defaultMessage: 'set SSO user',
    },
    more:{
        id: 'User.More',
        defaultMessage: 'More',
    },
    ssoInputCheck:{
        id: 'User.SSOInputCheck',
        defaultMessage: 'Please input SSO user.',
    },
    setSSOSuccess:{
        id: 'User.SetSSOSuccess',
        defaultMessage: 'Set SSO user successfully.',
    },
    setSSOFail:{
        id: 'User.SetSSOFail',
        defaultMessage: 'Set SSO user fail.',
    },
    state:{
        id: 'User.State',
        defaultMessage: 'Status',
    },
    operate:{
        id: 'User.Operate',
        defaultMessage: 'Operation',
    },
    update:{
        id: 'User.Update',
        defaultMessage: 'Update',
    },
    reauth:{
        id: 'User.Reauth',
        defaultMessage: 'State',
    },
    resetpasswd:{
        id: 'User.ResetPassword',
        defaultMessage: 'ResetPassword',
    },
    resetpasswdsuccess:{
        id: 'User.ResetPasswordSuccess',
        defaultMessage: 'ResetPassword success',
    },
    resetpasswdfailed:{
        id: 'User.ResetPasswordFailed',
        defaultMessage: 'ResetPassword failed',
    },
    passwordsDiff:{
        id: 'User.Error.PasswordsDiff',
        defaultMessage: 'Two passwords are different!',
    },
    del:{
        id: 'User.Del',
        defaultMessage: 'Delete',
    },
    currentPassword:{
        id: 'User.CurrentUserPassword',
        defaultMessage: 'Current user password',
    },
    password:{
        id: 'User.NewUser.NewPassword',
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
    description:{
        id: 'User.DescriptionUser',
        defaultMessage: 'The user list shows the operator information under the current user.',
    },
    userList:{
        id: 'User.UserList',
        defaultMessage: 'User List',
    },
    createUser:{
        id: 'User.CreateUser',
        defaultMessage: 'Create User',
    },
    reauthenticate:{
        id: 'User.ReAuth.Enquire',
        defaultMessage: 'Whether to re-authenticate',
    },
    delete:{
        id: 'User.Delete.Enquire',
        defaultMessage: 'Are you sure to delete',
    },
    successofreauth:{
        id: 'User.ReAuth.Success',
        defaultMessage: 'successful re-authentication',
    },
    active: {
        id: 'User.Active',
        defaultMessage: 'Active',
    },
    inactive: {
        id: 'User.Inactive',
        defaultMessage: 'Inactive',
    },
});

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();


const ResizeableTitle = (props) => {
    const { onResize, width, ...restProps } = props;
    
    if (!width) {
        return <th {...restProps} />;
    }
    return (
        <Resizable width={width} height={0} onResize={onResize}>
            <th {...restProps} />
        </Resizable>
    );
};

const FormItem = Form.Item;

const CreateForm = Form.create()(props => {
    const { modalVisible, form, handleAdd,activeState,onChangeSwitch,orgUserName,ModalVisible } = props;
    const okHandle = () => {
        form.validateFields((err, fieldsValue) => {
            if (err) return;
            form.resetFields();
            handleAdd(fieldsValue);
        });
    };
    
    const submitFormLayout = {
        wrapperCol: {
            xs: { span: 24, offset: 0 },
            sm: { span: 10, offset: 7 },
        },
    };
    
    return (
        <Modal
            title={ intl.formatMessage(messages.updateUser) }
            visible={modalVisible}
            onOk={okHandle}
            onCancel={() => ModalVisible()}
        >
            <FormItem
                labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label={ intl.formatMessage(messages.userName) } >
                {form.getFieldDecorator('name', {
                    initialValue: orgUserName,
                })(<span>{orgUserName}</span>)}
            </FormItem>
            <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label={ intl.formatMessage(messages.userState) }>
                {form.getFieldDecorator('state', {
                
                })(<Switch checkedChildren={<Icon type="check"/>} unCheckedChildren={<Icon type="close"/>} checked={activeState} onChange={onChangeSwitch}/>)}
            </FormItem>
        </Modal>
    );
});

const CreateFormForPassReset = Form.create()(props => {
    const { passwdmodalVisible, form, handleReset,orgUserName,PasswdModalVisible } = props;
    const okSubmit = () => {
        form.validateFields((err, fieldsValue) => {
            if (err) return;
            handleReset(fieldsValue);
        });
    };
    
    const submitFormLayout = {
        wrapperCol: {
            xs: { span: 24, offset: 0 },
            sm: { span: 10, offset: 7 },
        },
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
    
    return (
        <Modal
            title={ intl.formatMessage(messages.resetpasswd) }
            visible={passwdmodalVisible}
            onOk={okSubmit}
            onCancel={() => PasswdModalVisible()}
            destroyOnClose={true}
        >
            <FormItem {...formItemLayout} label={ intl.formatMessage(messages.currentPassword) }>
                {form.getFieldDecorator('currentpassword', {
                    rules: [
                        {
                            required: true,
                            message: intl.formatMessage(messages.inputPassword),
                        },
                    ],
                })(<Input type="password" style={{maxWidth: 515, width: '100%'}} placeholder={ intl.formatMessage(messages.inputPassword) }/>)}
            </FormItem>
            <FormItem {...formItemLayout} label={ intl.formatMessage(messages.userName) } >
                {form.getFieldDecorator('name', {
                    initialValue: orgUserName,
                })(<span>{orgUserName}</span>)}
            </FormItem>
            <FormItem {...formItemLayout} label={ intl.formatMessage(messages.password) }>
                {form.getFieldDecorator('password', {
                    rules: [
                        {
                            required: true,
                            message: intl.formatMessage(messages.inputPassword),
                        },
                    ],
                })(<Input type="password" style={{maxWidth: 515, width: '100%'}} placeholder={ intl.formatMessage(messages.inputPassword) }/>)}
            </FormItem>
            <FormItem {...formItemLayout} label={ intl.formatMessage(messages.rePassword) }>
                {form.getFieldDecorator('rePassword', {
                    rules: [
                        {
                            required: true,
                            message: intl.formatMessage(messages.reinputPassword),
                        },
                    ],
                })(<Input type="password" style={{maxWidth: 515, width: '100%'}} placeholder={ intl.formatMessage(messages.reinputPassword) }/>)}
            </FormItem>
        </Modal>
    );
});

const SetSSOUser = Form.create()(props => {
    const { ssoModalVisible, form, setSSOUser, SSOModalVisible, targetUserId, orgUserName } = props;
    const okHandle = () => {
        form.validateFields((err, fieldsValue) => {
            if (err) return;
            form.resetFields();
            setSSOUser({
                id: targetUserId,
                SSOUser: fieldsValue.SSOUser
            });
        });
    };
    
    return (
        <Modal
            title={ intl.formatMessage(messages.setSSO) }
            visible={ssoModalVisible}
            onOk={okHandle}
            onCancel={() => SSOModalVisible()}
            destroyOnClose={ true }
        >
            <FormItem
                labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label={ intl.formatMessage(messages.userName) } >
                {form.getFieldDecorator('name', {
                    initialValue: orgUserName,
                })(<span>{orgUserName}</span>)}
            </FormItem>
            <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label={ intl.formatMessage(messages.sso) }>
                {form.getFieldDecorator('SSOUser', {
                    rules: [
                        {
                            required: true,
                            message: intl.formatMessage(messages.ssoInputCheck),
                        },
                    ],
                })(<Input style={{maxWidth: 515, width: '100%'}} placeholder={ intl.formatMessage(messages.sso) }/>)}
            </FormItem>
        </Modal>
    );
});

@connect(({ OrgUserList,loading }) => ({
    OrgUserList,
    loading: loading.models.OrgUserList,
    //  loadingInfo:loading.effects['peerList/fetch'],
}))
@Form.create()
export default class OrgUserList extends PureComponent {
    state = {
        modalVisible: false,
        passwdmodalVisible: false,
        ssoModalVisible: false
    };
    toDetail = val => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'UserDetail',
                search: stringify({
                    name: val,
                })
                
            })
        )
    };
    
    componentDidMount() {
        const { dispatch } = this.props;
        dispatch({
            type: 'OrgUserList/fetch',
        });
    }
    
    
    handleModalVisible = (flag,row) => {
        this.setState({
            modalVisible: !!flag,
            activeState: row.active==="false"?false:true,
            orgUserName:row.username,
        });
    };
    
    ModalVisible = () => {
        this.setState({
            modalVisible: false,
        });
    };
    
    handleSSOModalVisible = row => {
        this.setState({
            targetUserId: row._id,
            orgUserName: row.username
        });
        
        this.SSOModalVisible();
    };
    
    SSOModalVisible = () => {
        this.setState({
            ssoModalVisible: !this.state.ssoModalVisible
        });
    };
    
    handlePasswdModalVisible = (flag,row) => {
        this.setState({
            passwdmodalVisible: !!flag,
            orgUserName:row.username,
            password:row.password,
            rePassword:row.rePassword,
            currentpassword:row.currentpassword,
        });
    };
    
    PasswdModalVisible = () => {
        this.setState({
            passwdmodalVisible: false,
        });
    };
    
    onChangeSwitch=(checked)=>{
        this.setState({
            activeState: checked,
        });
    };
    
    handleAdd = (fields) => {
        const {dispatch} = this.props;
        const orguser={name};
        orguser.name=fields.name;
        orguser.active=`${(this.state.activeState)}`;
        dispatch({
            type: 'OrgUserList/updateOrgUser',
            payload: {
                orguser: orguser,
                dispatch: dispatch
            },
        });
        this.setState({
            modalVisible: false,
        });
    };
    
    resetResponse=(result)=>{
        if(!result.success){
            message.error(intl.formatMessage(messages.resetpasswdfailed));
        }else{
            message.success(intl.formatMessage(messages.resetpasswdsuccess));
            this.setState({
                passwdmodalVisible: false,
            });
        }
    };
    
    handleReset = (fields) => {
        const {dispatch} = this.props;
        this.props.form.validateFieldsAndScroll({ force: true }, (err) => {
            if (!err) {
                if(fields.password===fields.rePassword){
                    const orguser = {
                        "name":          fields.name,
                        "curPassword":   fields.currentpassword,
                        "password":      fields.password,
                    };
                    this.props.dispatch({
                        type:    'OrgUserList/resetOrgUserPassword',
                        payload:  {
                            orguser:orguser,
                        },
                        callback: this.resetResponse,
                    });
                }
                else{
                    message.error(intl.formatMessage(messages.passwordsDiff));
                }
                
            }
        });
    };
    
    reEnrollOrgUser =(row) => {
        const { dispatch } = this.props;
        const orguser={
            name:row.username,
            reason:"cacompromise",
        };
        
        Modal.confirm({
            title: `${intl.formatMessage(messages.reauthenticate)}‘${row.username}’?`,
            onOk() {
                dispatch({
                    type: 'OrgUserList/reEnrollOrgUser',
                    payload: { orguser, msg: intl.formatMessage(messages.successofreauth)},
                    
                });
            },
        });
    };
    
    
    deleteOrgUser =(row) => {
        const { dispatch } = this.props;
        const orguser={
            name:row.username,
            reason:"cacompromise",
        };
        
        Modal.confirm({
            title: `${intl.formatMessage(messages.delete)}‘${row.username}’?`,
            onOk() {
                dispatch({
                    type: 'OrgUserList/removeOrgUser',
                    payload: { orguser },
                });
            },
        });
    };
    
    
    
    /* handleSelectRows = rows => {
       this.setState({
         selectedRows: rows,
       });
     };  */
    
    
    onAddNewOrgUser = () =>{
        this.props.dispatch(
            routerRedux.push({
                pathname: 'NewOrgUser',
            })
        )
    };
    
    components = {
        header: {
            cell: ResizeableTitle,
        },
    };
    
    handleResize = index => (e, { size }) => {
        this.setState(({ columns }) => {
            const nextColumns = [...columns];
            nextColumns[index] = {
                ...nextColumns[index],
                width: size.width,
            };
            return { columns: nextColumns };
        });
    };
    
    setSSOUser = fields => {
        const { dispatch } = this.props;
        
        dispatch({
            type: 'OrgUserList/SetSSOUser',
            payload: {
                setuser: {
                    id: fields.id,
                    SSOUser: fields.SSOUser
                }
            },
            callback: this.callbackForSetSSOUser
        });
    };
    
    callbackForSetSSOUser = response => {
        if ( !response.success ) {
            message.error(intl.formatMessage(messages.setSSOFail));
        }
        else {
            message.success(intl.formatMessage(messages.setSSOSuccess));
            this.SSOModalVisible();
            
            const { dispatch } = this.props;
            dispatch({
                type: 'OrgUserList/fetch',
            });
        }
    };
    
    render() {
        const {
            OrgUserList: { orgusers },
            loading,
        } = this.props;
        
        const {  modalVisible } = this.state;
        const {  passwdmodalVisible } = this.state;
        const {  ssoModalVisible } = this.state;
        const paginationProps = {
            showSizeChanger: true,
            showQuickJumper: true,
        };
        
        const parentMethods = {
            handleAdd: this.handleAdd,
            handleModalVisible: this.handleModalVisible,
            activeState:this.state.activeState,
            onChangeSwitch:this.onChangeSwitch,
            orgUserName:this.state.orgUserName,
            ModalVisible:this.ModalVisible,
            handleReset:this.handleReset,
            PasswdModalVisible:this.PasswdModalVisible,
            handlePasswdModalVisible:this.handlePasswdModalVisible,
            targetUserId: this.state.targetUserId,
            SSOModalVisible: this.SSOModalVisible,
            setSSOUser: this.setSSOUser
        };
        
        const menu = row => (
            <Menu>
                <Menu.Item>
                    <a  onClick={() => this.reEnrollOrgUser(row)}>{intl.formatMessage(messages.reauth)} </a>
                </Menu.Item>
                <Menu.Item>
                    <a  onClick={() => this.handlePasswdModalVisible(true,row)}>{intl.formatMessage(messages.resetpasswd)} </a>
                </Menu.Item>
                {
                    window.localStorage["cello-authority"] === "admin" &&
                    <Menu.Item>
                        <a onClick={() => this.handleSSOModalVisible(row)}> {intl.formatMessage(messages.setSSO)} </a>
                    </Menu.Item>
                }
                <Menu.Item>
                    <a  onClick={() => this.deleteOrgUser(row)}> {intl.formatMessage(messages.del)} </a>
                </Menu.Item>
            </Menu>
        );
        
        const MoreBtn = row => (
            <Dropdown overlay={menu(row)}>
                <a>
                    {intl.formatMessage(messages.more)}
                    <Icon type="down" />
                </a>
            </Dropdown>
        );
        
        const columnsList = [
            {
                title:  intl.formatMessage(messages.name) ,
                dataIndex: 'username',
                width: 120,
                render: val => (
                    <Fragment>
                        <a onClick={() => this.toDetail(val)}>{`${val}`}</a>
                    </Fragment>),
            },
            {
                title: intl.formatMessage(messages.role),
                dataIndex: 'roles',
                width: 80,
            },
            {
                title: intl.formatMessage(messages.relationship),
                dataIndex: 'affiliation',
                width: 80,
            },
            {
                title: intl.formatMessage(messages.sso),
                dataIndex: 'SSOUser',
                key: 'SSOUser',
                width: 100,
            },
            {
                title: intl.formatMessage(messages.state),
                dataIndex: 'active',
                key: 'active',
                width: 80,
                render: val => <Ellipsis tooltip lines={1}>{val === 'true' ? intl.formatMessage(messages.active) : intl.formatMessage(messages.inactive)}</Ellipsis>,
            },
            {
                title: intl.formatMessage(messages.operate),
                width: 250,
                render: (row) => (
                    <Fragment>
                        <a  onClick={() => this.handleModalVisible(true,row)}> {intl.formatMessage(messages.update)} </a>
                        <Divider type="vertical" />
                        <MoreBtn {...row}/>
                    </Fragment>
                ),
            }];
        
        const columns = columnsList.map((col, index) => ({
            ...col,
            onHeaderCell: column => ({
                width: column.width,
                onResize: this.handleResize(index),
            }),
        }));
        
        
        return (
            <PageHeaderLayout title={ intl.formatMessage(messages.userList) }
                              content={ intl.formatMessage(messages.description) }
                              logo={<Icon type="user" style={{fontSize: 30, color: '#722ed1'}} />}   >
                <Card bordered={false}>
                    <div className={styles.tableList}>
                        <div className={styles.tableListOperator}>
                            <Button icon="plus" type="primary" onClick={this.onAddNewOrgUser}>
                                { intl.formatMessage(messages.createUser) }
                            </Button>
                        </div>
                        <Table
                            components={this.components}
                            className={styles.table}
                            loading={loading}
                            dataSource={orgusers}
                            columns={columns}
                            pagination={paginationProps}
                            onChange={this.handleTableChange}
                        />
                    </div>
                </Card>
                <CreateForm {...parentMethods} modalVisible={modalVisible} />
                <CreateFormForPassReset {...parentMethods} passwdmodalVisible={passwdmodalVisible} />
                <SetSSOUser {...parentMethods} ssoModalVisible={ssoModalVisible} />
            </PageHeaderLayout>
        );
        
    }
}
