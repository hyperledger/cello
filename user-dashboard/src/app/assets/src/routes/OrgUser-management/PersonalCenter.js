import React, { PureComponent } from 'react';
import { connect, } from 'dva';
import { Card, Form, Button, Divider, Icon, Row, Col, Input } from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './PersonalCenter.less';
import {defineMessages, IntlProvider} from "react-intl";
import {getLocale} from "../../utils/utils";
import moment from "moment/moment";

const messages = defineMessages({
    role:{
        id: 'User.UserRole',
        defaultMessage: 'Role',
    },
    relationship:{
        id: 'User.Relationship',
        defaultMessage: 'Department',
    },
    version:{
        id: 'User.CaVersion',
        defaultMessage: 'Version',
    },
    administrator: {
        id: 'User.NewUser.Administrator',
        defaultMessage: 'Administrator',
    },
    operator: {
        id: 'User.NewUser.Operator',
        defaultMessage: 'Operator',
    },
    date: {
        id: 'User.CreationTime',
        defaultMessage: 'Creation Time'
    },
    address: {
        id: 'User.Address',
        defaultMessage: 'Address'
    },
    phone: {
        id: 'User.Phone',
        defaultMessage: 'Phone'
    },
    email: {
        id: 'User.Email',
        defaultMessage: 'Email'
    },
    personal: {
        id: 'User.PersonalCenter',
        defaultMessage: 'Personal Center'
    },
    btnEdit: {
        id: 'User.BtnEdit',
        defaultMessage: 'Edit'
    },
    btnSave: {
        id: 'User.BtnSave',
        defaultMessage: 'Save'
    },
    btnCancel: {
        id: 'User.BtnCancel',
        defaultMessage: 'Cancel'
    }
});

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

@connect(({ OrgUserList,loading }) => ({
    OrgUserList,
    loading: loading.models.OrgUserList,
    submitting: loading.effects['OrgUserList/updateUserInfo'],
}))
@Form.create()
export default class PersonalCenter extends PureComponent {
    state = {
        phone: '',
        addr: '',
        email: '',
        date: '',
        edit: false,
        btnEditMsg: intl.formatMessage(messages.btnEdit),
        bChange: false
    };
    
    componentDidMount() {
        const { dispatch } = this.props;
        dispatch({
            type: 'OrgUserList/getUser',
            payload: {
                username: window.username
            }
        });
    }
    
    Detail( title, fun, value, edit ){
        let val = value;
        if (edit) {
            if (value === 'phone') {
                val = this.state.phone;
            }
            else if (value === 'address') {
                val = this.state.addr;
            }
            else if (value === 'email') {
                val = this.state.email;
            }
        }
        return(
            <Row style={{margin: '20px 60px 0px 60px'}}>
                <Col span={4}>
                    <p style={{
                        fontWeight: 'bolder',
                    }}
                    >
                        {title}
                    </p>
                </Col>
                <Col span={20}>
                    {
                        edit ? (this.state.edit ? <Input value={val} onChange={fun} style={{margin: '-6px 0px 0px -12px'}} /> : <p>{val}</p>) : <p>{val}</p>
                    }
                </Col>
            </Row>
        )
    };
    
    onChangePhone = (value) => {
        this.setState({phone:value.target.value, bChange: true});
    };
    
    onChangeAddr = (value) => {
        this.setState({addr:value.target.value, bChange: true});
    };
    
    onChangeEmail = (value) => {
        this.setState({email:value.target.value, bChange: true});
    };
    
    onBtnEdit = () => {
        if (!this.state.edit) {
            this.setState({
                edit: true,
                btnEditMsg: intl.formatMessage(messages.btnSave),
            });
        }
        else {
            if (this.state.bChange) {
                this.props.dispatch({
                    type: 'OrgUserList/updateUserInfo',
                    payload: {
                        information: {
                            address: this.state.addr,
                            phone: this.state.phone,
                            email: this.state.email
                        },
                        dispatch: this.props.dispatch
                    },
                });
            }
            this.setState({edit: false, btnEditMsg: intl.formatMessage(messages.btnEdit)});
        }
    };
    
    onBtnCancel = () => {
        this.setState({
            edit: false,
            btnEditMsg: intl.formatMessage(messages.btnEdit),
        });
        const { dispatch } = this.props;
        dispatch({
            type: 'OrgUserList/getUser',
            payload: {
                username: window.username
            }
        });
    };
    
    renderDetail(title, fun, value, edit) {
        return this.Detail(title, fun, value, edit);
    }
    
    render() {
        const {
            OrgUserList: { currentUser },
            submitting
        } = this.props;
        
        if (Array.isArray(currentUser.information) && !this.state.edit) {
            this.setState({
                phone: currentUser.information[currentUser.information.length - 1].phone,
                addr: currentUser.information[currentUser.information.length - 1].address,
                email: currentUser.information[currentUser.information.length - 1].email,
                date: currentUser.information[0].time
            });
        }
        
        const role = currentUser.roles === 'org_admin' ? intl.formatMessage(messages.administrator) : intl.formatMessage(messages.operator);
        
        return (
            <PageHeaderLayout title={ intl.formatMessage(messages.personal) }
                              content={ '' }
                              logo={<Icon type="idcard" style={{fontSize: 30, color: '#722ed1'}} />}   >
                <Card bordered={false}>
                    <div style={{marginBottom: '20px'}}>
                        <div className={styles.userName}>
                            <span style={{marginRight: '20px'}}>{window.username}</span>
                            <Button style={{float: 'right', marginRight: '30px'}} onClick={this.onBtnEdit} loading={submitting} type="primary" >{this.state.btnEditMsg}</Button>
                            {this.state.edit ? <Button style={{float: 'right', marginRight: '10px'}} onClick={this.onBtnCancel} >{intl.formatMessage(messages.btnCancel)}</Button> : ''}
                        </div>
                        <Divider/>
                    </div>
                    {this.renderDetail(intl.formatMessage(messages.role),'', role, false)}
                    {this.renderDetail(intl.formatMessage(messages.relationship),'', currentUser.affiliation, false)}
                    {this.renderDetail(intl.formatMessage(messages.version),'', currentUser.caVersion, false)}
                    {this.renderDetail(intl.formatMessage(messages.date),'', moment(this.state.date).format('YYYY-MM-DD HH:mm:ss'), false)}
                    {this.renderDetail(intl.formatMessage(messages.phone), this.onChangePhone, 'phone', true)}
                    {this.renderDetail(intl.formatMessage(messages.address), this.onChangeAddr, 'address', true)}
                    {this.renderDetail(intl.formatMessage(messages.email), this.onChangeEmail, 'email', true)}
                </Card>
            </PageHeaderLayout>
        );
    }
}
