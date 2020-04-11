import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import { stringify } from 'qs';
import { Card, Modal, Button, Icon, Divider, Form, Input } from 'antd';
import { routerRedux } from 'dva/router';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './orglist.less';
import STable from 'components/StandardTableForNetWork';
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from "../../utils/utils";

const messages = defineMessages({
    colName: {
        id: 'Organization.Col.Name',
        defaultMessage: 'Name',
    },
    colDesc: {
        id: 'Organization.Col.Desc',
        defaultMessage: 'Description',
    },
    colType: {
        id: 'Organization.Col.Type',
        defaultMessage: 'Type',
    },
    colDomain: {
        id: 'Organization.Col.Domain',
        defaultMessage: 'Domain',
    },
    colNetwork: {
        id: 'Organization.Col.Network',
        defaultMessage: 'Network',
    },
    colOperate: {
        id: 'Organization.Col.Operate',
        defaultMessage: 'Operation',
    },
    operateDetails: {
        id: 'Organization.OperateDetails',
        defaultMessage: 'Details',
    },
    operateDelete: {
        id: 'Organization.OperateDelete',
        defaultMessage: 'Delete',
    },
    deleteWarning: {
        id: 'Organization.DeleteWarning',
        defaultMessage: 'The organization belongs to \" {name} \" network and can not be deleted.',
    },
    deleteConfirm: {
        id: 'Organization.Confirm',
        defaultMessage: 'Are you sure to delete organization \" {name} \"?',
    },
    pageTitle: {
        id: 'Organization.pageTitle',
        defaultMessage: 'Organization Management',
    },
    pageDesc: {
        id: 'Organization.pageDesc',
        defaultMessage: 'Organization,is the basic unit of a network,there must be two types of organizations in a network,\"peer\" and \"orderer\",respectively.organizations of the \"orderer\" type contain hosts that sort transactions.Organizations of the \"peer\" type can define themselves according to actual needs.Companies,organs or social organizations can also be smaller collectives,such as departments.',
    },
    orgList: {
        id: 'Organization.OrgList',
        defaultMessage: 'Organization List',
    },
    orgAdd: {
        id: 'Organization.OrgAdd',
        defaultMessage: 'Add',
    },
    operateAppendPeer: {
        id: 'Organization.AppendPeer',
        defaultMessage: 'Add peer'
    },
    buttonOk: {
        id: 'Organization.OK',
        defaultMessage: 'Ok'
    },
    buttonCancel: {
        id: 'Organization.Cancel',
        defaultMessage: 'Cancel'
    },
    peerNumForAdd: {
        id: 'Organization.PeerNumForAdd',
        defaultMessage: 'Number of new peers'
    },
    peerNumForAddWarning: {
        id: 'Organization.peerNumForAddWarning',
        defaultMessage: 'The number of new peers must be integer greater than 0.'
    },
    addPeerFail: {
        id: 'Organization.addPeerFail',
        defaultMessage: 'Failed to add peer.'
    }
});
const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();
const FormItem = Form.Item;

@connect(({ organization,loading }) => ({
    organization,
    loading: loading.models.organization,
    addingPeer: loading.effects['organization/appendPeer']
}))

@Form.create()
export default class OrganizationList extends PureComponent {
    state = {
        formValues: {},
        addPeerVisible: false,
        targetOrgForAddPeer: {}
    };

    constructor(props) {
        super(props);
        const { dispatch } = this.props;
        dispatch({
            type: 'organization/fetch',
        });
    }

    onClickEdit = (org) =>{
        this.props.dispatch(
            routerRedux.push({
                pathname: 'addorg',
                search: stringify({
                    id: org.id,
                    action: 'edit'
                }),
            })
        )
    };

    onClickAdd = () =>{
        this.props.dispatch(
            routerRedux.push({
                pathname: 'addorg',
                search: stringify({
                    action: 'create',
                }),
            })
        )
    };

    handleStandardTableChange = (pagination, filtersArg, sorter) => {
        const { dispatch } = this.props;
        const { formValues } = this.state;

        const filters = Object.keys(filtersArg).reduce((obj, key) => {
            const newObj = { ...obj };
            newObj[key] = getValue(filtersArg[key]);
            return newObj;
        }, {});

        const params = {
            currentPage: pagination.current,
            pageSize: pagination.pageSize,
            ...formValues,
            ...filters,
        };
        if (sorter.field) {
            params.sorter = `${sorter.field}_${sorter.order}`;
        }

        dispatch({
            type: 'organization/fetch',
            payload: params,
        });
    };

    onClickDel = org => {
        const { dispatch } = this.props;

        if (org.network !== '') {
            const name = org.network;
            Modal.warning({
                title: intl.formatMessage(messages.deleteWarning, { name })
            });
            return;
        }

        const {name} = org;
        const values = { name };
        Modal.confirm({
            title: intl.formatMessage(messages.deleteConfirm, values),
            onOk() {
                dispatch({
                    type: 'organization/DelOrg',
                    payload: {
                        orgid: org.id,
                        orgName: org.name,
                        orgType: org.type
                    },
                });
            },
        });
    };

    handleFormSubmit(value){
        const { dispatch } = this.props;

        dispatch({
            type: 'organization/SearchOrg',
            payload: {
                count: 10,
                orgname: value,
            },
        });
    };

    getLen(str){
        if (str === null){
            return 0;
        }
        if (typeof(str) !== "string"){
            str += "";
        }
        return str.replace(/[^\x00-\xff]/g, "01").length;
    };
    
    onClickAppendPeer = org => {
        this.setState({
            addPeerVisible: true,
            targetOrgForAddPeer: org
        })
    };
    
    commitPeerNum = e => {
        e.preventDefault();
        this.props.form.validateFieldsAndScroll({ force: true }, (err, values) => {
            if (!err) {
                this.props.dispatch({
                    type: 'organization/appendPeer',
                    payload: {
                        organization_id: this.state.targetOrgForAddPeer.id,
                        peerNum: {
                            peerNum: parseInt(values.number)
                        }
                    },
                    callback: this.appendPeerCallback
                });
            }
        });
    };
    
    appendPeerCallback = response => {
        if (response.status === 'OK') {
            this.setState({
                addPeerVisible: false
            });
        }
        else {
            Modal.error({
                title:intl.formatMessage(messages.addPeerFail),
            });
        }
    };
    
    cancelForAddPeer = () => {
        this.setState({
            addPeerVisible: false,
            targetOrgForAddPeer: {}
        })
    };

    render() {
        const {
            organization : {organization},
            addingPeer,
            loading,
        } = this.props;

        const orgs = Array.isArray(organization) ? organization : [];
        const { getFieldDecorator } = this.props.form;

        const columns = [
            {
                title: intl.formatMessage(messages.colName),
                dataIndex: 'name',
            },
            {
                title: intl.formatMessage(messages.colDesc),
                dataIndex: 'description',
            },
            {
                title: intl.formatMessage(messages.colType),
                dataIndex: 'type',
            },
            {
                title: intl.formatMessage(messages.colDomain),
                dataIndex: 'domain',
            },
            {
                title: intl.formatMessage(messages.colNetwork),
                dataIndex: 'network',
            },
            {
                title: intl.formatMessage(messages.colOperate),
                render: row => (
                    <Fragment>
                        <a onClick={() => this.onClickEdit(row)}>{intl.formatMessage(messages.operateDetails)}</a>
                        {
                            row.type === 'peer' &&
                            <span>
                                <Divider type="vertical" />
                                <a onClick={() => this.onClickAppendPeer(row)}>{intl.formatMessage(messages.operateAppendPeer)}</a>
                            </span>
                        }
                        <Divider type="vertical" />
                        <a onClick={() => this.onClickDel(row)}>{intl.formatMessage(messages.operateDelete)}</a>
                    </Fragment>
                ),
            },
        ];
    
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

        return (
            <PageHeaderLayout
                title={intl.formatMessage(messages.pageTitle)}
                logo={<Icon type="team" style={{fontSize: 30, color: '#722ed1'}} />}
                content={intl.formatMessage(messages.pageDesc)}
            >
                <div className={styles.standardList}>
                    <Card
                        className={styles.standardList.listCard}
                        bordered={false}
                        title={intl.formatMessage(messages.orgList)}
                        style={{ marginTop: 24 }}
                        bodyStyle={{ padding: '0 32px 40px 32px' }}
                    >
                        <Button onClick={this.onClickAdd} type="dashed" style={{ width: '100%', marginBottom: 8 }} icon="plus">
                            {intl.formatMessage(messages.orgAdd)}
                        </Button>
                        <hr />
                        <STable
                            loading={loading}
                            data={{list:orgs}}
                            columns={columns}
                            onChange={this.handleStandardTableChange}
                        />
                    </Card>
                </div>
                <Modal
                    title={intl.formatMessage(messages.operateAppendPeer)}
                    visible={this.state.addPeerVisible}
                    destroyOnClose={true}
                    footer={null}
                >
                    <Form onSubmit={this.commitPeerNum} style={{marginTop: 8}}>
                        <FormItem
                            {...formItemLayout}
                            label={intl.formatMessage(messages.peerNumForAdd)}
                        >
                            {getFieldDecorator('number', {
                                rules: [{required: true,
                                    pattern: new RegExp("^[1-9]\\d*$"),
                                    message: intl.formatMessage(messages.peerNumForAddWarning)}],
                            })(<Input style={{width: '100%'}} placeholder={intl.formatMessage(messages.peerNumForAdd)}/>)}
                        </FormItem>
                        <FormItem {...submitFormLayout} style={{marginTop: 32}}>
                            <Button onClick={this.cancelForAddPeer}>
                                {intl.formatMessage(messages.buttonCancel)}
                            </Button>
                            <Button loading={addingPeer} type="primary" htmlType="submit" style={{marginLeft: 10}}>
                                {intl.formatMessage(messages.buttonOk)}
                            </Button>
                        </FormItem>
                    </Form>
                </Modal>
            </PageHeaderLayout>
        );
    }
}
