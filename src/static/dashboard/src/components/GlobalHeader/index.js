/*
SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent } from 'react';
import { Menu, Form, Modal, Icon, Input, Spin, Dropdown, Avatar, Divider, message, Button } from 'antd';
import Debounce from 'lodash-decorators/debounce';
import { Link } from 'dva/router';
import styles from './index.less';
import { getLang, getLocale } from '../../utils/utils';
import reqwest from 'reqwest';
import { defineMessages, IntlProvider } from "react-intl";

const currentLocale = getLocale();

const FormItem = Form.Item;
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

const messages = defineMessages({
    menus: {
        changePassword: {
            id: 'Head.ChangePassword',
            defaultMessage: '修改密码',
        },
        inputOldPassword: {
            id: 'Head.InputOldPassword',
            defaultMessage: '请输入旧密码',
        },
        inputNewPassword: {
            id: 'Head.InputNewPassword',
            defaultMessage: '请输入新密码',
        },
        inputNewPasswordAgain: {
            id: 'Head.InputNewPasswordAgain',
            defaultMessage: '请再次输入新密码',
        },
        diffPassword: {
            id: 'Head.DiffPassword',
            defaultMessage: '两次输入的密码不一致',
        },
        logOut: {
            id: 'Head.LogOut',
            defaultMessage: '退出登录',
        },
        changeSuccess: {
            id: 'Head.ChangeSuccess',
            defaultMessage: '修改密码成功',
        },
        changeFailed: {
            id: 'Head.ChangeFailed',
            defaultMessage: '修改密码失败',
        }
    },
});

const CreateForm = Form.create()(props => {
    
    const {
        modalVisible,
        form,
        handleAdd,
        handleModalVisible,
    } = props;
    
    const okHandle = () => {
        form.validateFields((err, fieldsValue) => {
            if (err) return;
            handleAdd(fieldsValue);
        });
    };
    
    const formItemLayout = {
        labelCol: {
            xs: { span: 24 },
            sm: { span: 12 },
        },
        wrapperCol: {
            xs: { span: 24 },
            sm: { span: 12 },
        },
    };
    
    return (
        <Modal
            title={intl.formatMessage(messages.menus.changePassword)}
            visible={modalVisible}
            onOk={okHandle}
            onCancel={() => handleModalVisible(false)}
            width={600}
            destroyOnClose={true}
        >
            <Form {...formItemLayout} style={{ width: 500}}>
                <FormItem {...formItemLayout} label={intl.formatMessage(messages.menus.inputOldPassword) + ':'} >
                    {form.getFieldDecorator('oldPassword', {
                        initialValue: '',
                        rules: [
                            {
                                required: true,
                                message: intl.formatMessage(messages.menus.inputOldPassword),
                            },
                        ],
                    })(<Input type="password" placeholder={intl.formatMessage(messages.menus.inputNewPassword)} />)}
                </FormItem>
                <FormItem {...formItemLayout} label={intl.formatMessage(messages.menus.inputNewPassword) + ':'} >
                    {form.getFieldDecorator('newPassword', {
                        initialValue: '',
                        rules: [
                            {
                                required: true,
                                message: intl.formatMessage(messages.menus.inputNewPassword),
                            },
                        ],
                    })(<Input type="password" placeholder={intl.formatMessage(messages.menus.inputNewPassword)} />)}
                </FormItem>
                <FormItem {...formItemLayout} label={intl.formatMessage(messages.menus.inputNewPasswordAgain) + ':'} >
                    {form.getFieldDecorator('againPassword', {
                        initialValue: '',
                        rules: [
                            {
                                required: true,
                                message: intl.formatMessage(messages.menus.inputNewPasswordAgain),
                            },
                        ],
                    })(<Input type="password" placeholder={intl.formatMessage(messages.menus.inputNewPasswordAgain)} />)}
                </FormItem>
            </Form>
        </Modal>
    );
});

const language = getLang();
@Form.create()
export default class GlobalHeader extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            modalVisible: false,
        };
    };
    
    componentWillUnmount() {
        this.triggerResizeEvent.cancel();
    }
    toggle = () => {
        const { collapsed, onCollapse } = this.props;
        onCollapse(!collapsed);
        this.triggerResizeEvent();
    };
    /* eslint-disable*/
    @Debounce(600)
    triggerResizeEvent() {
        const event = document.createEvent('HTMLEvents');
        event.initEvent('resize', true, false);
        window.dispatchEvent(event);
    }
    changeLanguage = () => {
        localStorage.setItem('language', language === 'en' ? 'zh-CN' : 'en');
        window.location.reload();
    };
    
    handleModalVisible = (flag) => {
        this.setState({
            modalVisible: flag,
        });
    };
    
    handleAdd = fields => {
        if(fields.newPassword === fields.againPassword){
            const formData = new FormData();
            formData.append('new_password', fields.newPassword);
            formData.append('old_password', fields.oldPassword);
            
            reqwest({
                url:`/api/user/${window.user_id}/changePassword`,
                method:'post',
                processData: false,
                data: formData,
                success: () => {
                    this.setState({
                        submitting: false,
                        modalVisible: false,
                    });
                    message.success(intl.formatMessage(messages.menus.changeSuccess));
                },
                
                error: () => {
                    this.setState({
                        submitting:false,
                    });
                    message.error(intl.formatMessage(messages.menus.changeFailed));
                }
            });
        }
        else{
            message.error(intl.formatMessage(messages.menus.diffPassword));
        }
    };
    
    render() {
        const { collapsed, isMobile, logo, onMenuClick } = this.props;
        const {  modalVisible } = this.state;
        const parentMethods = {
            handleAdd: this.handleAdd,
            handleModalVisible: this.handleModalVisible,
        };
        
        const menu = (
            <Menu className={styles.menu} selectedKeys={[]} >
                <Menu.Item  key="password"  onClick={() =>this.handleModalVisible(true) } >
                    <Icon type="key" />{intl.formatMessage(messages.menus.changePassword)}
                </Menu.Item>
                <Menu.Item key="logout" onClick={onMenuClick}>
                    <Icon type="logout" />{intl.formatMessage(messages.menus.logOut)}
                </Menu.Item>
            </Menu>
        );
        return (
            <div className={styles.header}>
                {isMobile && [
                    <Link to="/" className={styles.logo} key="logo">
                        <img src={logo} alt="logo" width="32" />
                    </Link>,
                    <Divider type="vertical" key="line" />,
                ]}
                <Icon
                    className={styles.trigger}
                    type={collapsed ? 'menu-unfold' : 'menu-fold'}
                    onClick={this.toggle}
                />
                <div className={styles.right}>
                    {
                        <Button size="small" onClick={this.changeLanguage}>
                            {language === 'en' ? '中文' : 'En'}
                        </Button>
                    }
                    {window.username ? (
                        <Dropdown overlay={menu}>
                            <span className={`${styles.action} ${styles.account}`}>
                                <Avatar size="small" className={styles.avatar} icon="user" />
                                <span className={styles.name}>{window.username}</span>
                            </span>
                        </Dropdown>
                    ) : (
                        <Spin size="small" style={{ marginLeft: 8 }} />
                    )}
                </div>
                <CreateForm {...parentMethods} modalVisible={modalVisible} />
            </div>
        );
    }
}
