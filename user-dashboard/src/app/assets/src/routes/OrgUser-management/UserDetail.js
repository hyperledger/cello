import React, { PureComponent } from 'react';
import { connect, } from 'dva';
import { Card, Form, Button, Divider, Icon, Row, Col, Collapse } from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './UserDetail.less';
import {defineMessages, IntlProvider} from "react-intl";
import {getLocale} from "../../utils/utils";
import moment from "moment/moment";
import DescriptionList from 'components/DescriptionList';
import {routerRedux} from "dva/router";

const { Description } = DescriptionList;
const { Panel } = Collapse;

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
    title: {
        id: 'User.UserDetail',
        defaultMessage: 'User Detail'
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
    },
    name: {
        id: 'User.UpUser.UserName',
        defaultMessage: 'User Name'
    },
    back: {
        id: 'ChainCode.Details.Back',
        defaultMessage: 'Back',
    },
    history: {
        id: 'User.HistoryLabel',
        defaultMessage: 'Revision History',
    },
    noInfo: {
        id: 'User.History.NoHistory',
        defaultMessage: 'No revision record',
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
}))
@Form.create()
export default class PersonalCenter extends PureComponent {
    
    componentDidMount() {
        const { dispatch } = this.props;
        const location = this.props.location || this.context.location;
        const search = new URLSearchParams(location.search);
        const name = search.get('name');
        dispatch({
            type: 'OrgUserList/getUser',
            payload: {
                username: name
            }
        });
    }
    
    onBtnCancel = () => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'OrgUserList',
            })
        );
    };
    
    render() {
        const {
            OrgUserList: { currentUser },
        } = this.props;
        
        let phone = '';
        let addr = '';
        let email = '';
        let date = '';
        let information = [];
        if ( Array.isArray(currentUser.information) ) {
            phone = currentUser.information[currentUser.information.length - 1].phone;
            addr = currentUser.information[currentUser.information.length - 1].address;
            email = currentUser.information[currentUser.information.length - 1].email;
            date = currentUser.information[0].time;
            information = currentUser.information;
        }
        
        const role = currentUser.roles === 'org_admin' ? intl.formatMessage(messages.administrator) : intl.formatMessage(messages.operator);
        
        return (
            <PageHeaderLayout title={ intl.formatMessage(messages.title) }
                              content={ '' }
                              logo={<Icon type="user" style={{fontSize: 30, color: '#722ed1'}} />} >
                <Card bordered={false}>
                    <Button icon="rollback" type="primary" onClick={this.onBtnCancel}>
                        {intl.formatMessage(messages.back)}
                    </Button>
                    <DescriptionList style={{ marginTop: 20, marginLeft: 20, marginRight: 20 }} col={2}>
                        <Description term={ intl.formatMessage(messages.name) }>{currentUser.username}</Description>
                        <Description term={ intl.formatMessage(messages.role) }>{role}</Description>
                        <Description term={ intl.formatMessage(messages.relationship) }>{currentUser.affiliation}</Description>
                        <Description term={ intl.formatMessage(messages.date) }>{moment(date).format('YYYY-MM-DD HH:mm:ss')}</Description>
                        <Description term={ intl.formatMessage(messages.phone) }>{phone}</Description>
                        <Description term={ intl.formatMessage(messages.address) }>{addr}</Description>
                        <Description term={ intl.formatMessage(messages.email) }>{email}</Description>
                        <Description term={ intl.formatMessage(messages.version) }>{currentUser.caVersion}</Description>
                    </DescriptionList>
                    <div style={{textAlign: 'center', margin: '30px 150px 20px 150px'}}>
                        <span style={{fontWeight: 'bolder', fontSize: 'larger', color: '#d487bf'}}>{intl.formatMessage(messages.history)}</span>
                        <div style={{textAlign: 'left', marginTop: 30}}>
                            {information.length > 1 ? <Collapse defaultActiveKey={['0']} expandIconPosition={'left'}>
                                {
                                    information.map( infor => {
                                        return (
                                            <Panel header={moment(infor.time).format('YYYY-MM-DD HH:mm:ss')} >
                                                <div>
                                                    <span>{intl.formatMessage(messages.address) + ' :'}</span>
                                                    <span style={{marginLeft: 10}}>{infor.address}</span>
                                                </div>
                                                <div style={{marginTop: 10}}>
                                                    <span>{intl.formatMessage(messages.phone) + ' :'}</span>
                                                    <span style={{marginLeft: 10}}>{infor.phone}</span>
                                                </div>
                                                <div style={{marginTop: 10}}>
                                                    <span>{intl.formatMessage(messages.email) + ' :'}</span>
                                                    <span style={{marginLeft: 10}}>{infor.email}</span>
                                                </div>
                                            </Panel>
                                        )
                                    })
                                }
                            </Collapse> : <div style={{textAlign: 'center'}} ><Icon type="frown" style={{fontSize: 20, marginTop: 10}} /><span style={{marginLeft: 10, fontSize: 15}}>{intl.formatMessage(messages.noInfo)}</span></div>}
                        </div>
                    </div>
                </Card>
            </PageHeaderLayout>
        );
    }
}