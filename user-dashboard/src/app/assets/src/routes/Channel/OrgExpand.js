import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import {
    Card,
    Form,
    Button,
    Icon,
    Table,
    Select,
    Modal,
    Popconfirm,
    Row,
    Col
} from 'antd';
import { routerRedux } from 'dva/router';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './OrgExpand.less';
import { Resizable } from 'react-resizable';
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from "../../utils/utils";

const messages = defineMessages({
    pageTitle: {
        id: 'Channel.AppendOrg.pageTitle',
        defaultMessage: 'Additional Organization',
    },
    pageDesc: {
        id: 'Channel.AppendOrg.pageDesc',
        defaultMessage: 'You can invite new organizations to jion the current channel.',
    },
    tableTitle: {
        id: 'Channel.AppendOrg.tableTitle',
        defaultMessage: 'Invited Organizations',
    },
    buttonBack: {
        id: 'Channel.AppendOrg.buttonBack',
        defaultMessage: 'Back',
    },
    buttonCancel: {
        id: 'Channel.AppendOrg.buttonCancel',
        defaultMessage: 'Cancel',
    },
    buttonOk: {
        id: 'Channel.AppendOrg.buttonOk',
        defaultMessage: 'Ok',
    },
    buttonInvite: {
        id: 'Channel.AppendOrg.buttonInvite',
        defaultMessage: 'Invite',
    },
    colOrgName: {
        id: 'Channel.AppendOrg.colOrgName',
        defaultMessage: 'Organization Name',
    },
    colDesc: {
        id: 'Channel.AppendOrg.colDesc',
        defaultMessage: 'Description',
    },
    colOperation: {
        id: 'Channel.AppendOrg.colOperation',
        defaultMessage: 'Operation',
    },
    agree: {
        id: 'Channel.AppendOrg.agree',
        defaultMessage: 'Agree',
    },
    agreed: {
        id: 'Channel.AppendOrg.agreed',
        defaultMessage: 'Agreed',
    },
    check: {
        id: 'Channel.AppendOrg.Check',
        defaultMessage: 'Are you sure you agree that the organization will join the current channel?'
    },
    modelTitle: {
        id: 'Channel.AppendOrg.ModalTitle',
        defaultMessage: 'Invite New Organization',
    },
    modelLabel: {
        id: 'Channel.AppendOrg.ModalLabel',
        defaultMessage: 'Choose organization',
    },
    modelInfo: {
        id: 'Channel.AppendOrg.ModalLabel',
        defaultMessage: 'Choose organization',
    },
    modelWarning: {
        id: 'Channel.AppendOrg.ModalWarning',
        defaultMessage: 'Please choose at least one organization.',
    },
});

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

const { Option } = Select;
const FormItem = Form.Item;

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

@connect(({ OrgExpand,loading }) => ({
    OrgExpand,
    loading: loading.models.OrgExpand,
    submitting: loading.effects['OrgExpand/add']
}))
@Form.create()
export default class OrgExpand extends PureComponent {
    state = {
        modalVisible: false,
        expandForm: false,
        selectedRows: [],
        formValues: {},
        orgList: [],
        selOrgs: []
    };

    componentDidMount() {
        const { dispatch } = this.props;
        const location = this.props.location;
        const search = new URLSearchParams(location.search);
        const channelId = search.get('id');
         dispatch({
             type: 'OrgExpand/fetch',
             payload: {
                 channelId: channelId
             }
         });
    }

    clickCancel = () => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'ChannelList',
            })
        );
    };

    onSelectOrgs = (value) => {
        this.setState({
            selOrgs: value
        });
    };

    onInvitation = () =>{
        const {
            OrgExpand: { OrgList },
        } = this.props;

        const Options = OrgList.map(org => (
            <Option key={org.id} value={org.id}>
                <span>{org.name}</span>
            </Option>
        ));

        this.setState({
            modalVisible: true,
            orgList: Options
        })
    };

    ModalCancel = () => {
        this.setState({
            modalVisible: false,
            selOrgs: []
        })
    };

    commitOrg = () => {
        const { dispatch } = this.props;
        const location = this.props.location;
        const search = new URLSearchParams(location.search);
        const channelId = search.get('id');

        if (this.state.selOrgs.length === 0) {
            Modal.warning({
                title: intl.formatMessage(messages.modelWarning)
            });
            return;
        }
        dispatch({
            type: 'OrgExpand/add',
            payload: {
                channelId: channelId,
                peer_orgs: this.state.selOrgs,
                dispatch: dispatch
            }
        });
        this.setState({
            modalVisible: false
        })
    };

    components = {
        header: {
            cell: ResizeableTitle,
        },
    };

    onAgree = (id) => {
        const { dispatch } = this.props;
        const location = this.props.location;
        const search = new URLSearchParams(location.search);
        const channelId = search.get('id');
        dispatch({
            type: 'OrgExpand/agree',
            payload: {
                channelId: channelId,
                peer_orgs: [id],
                dispatch: dispatch
            }
        });
    };

    render() {
        const {
            OrgExpand: { OrgList, OrgListInvited },
            loadingInfo,
            submitting,
        } = this.props;

        const columnsOrgSign = [
            {
                title: intl.formatMessage(messages.colOrgName),
                dataIndex: 'name',
            },
            {
                title: intl.formatMessage(messages.colDesc),
                dataIndex: 'description',
            },
            {
                title: intl.formatMessage(messages.colOperation),
                width: 250,
                render: (text, record, index) => (
                    <Fragment>
                        {record.signed === 0 ? <Popconfirm title={intl.formatMessage(messages.check)} onConfirm={() => this.onAgree(record.id)}><a href="#">{intl.formatMessage(messages.agree)}</a></Popconfirm> : intl.formatMessage(messages.agreed)}
                    </Fragment>
                ),
            }
        ];

        const paginationProps = {
            showSizeChanger: true,
            showQuickJumper: true,
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
            <PageHeaderLayout title={intl.formatMessage(messages.pageTitle)}   content={intl.formatMessage(messages.pageDesc)}
                              logo={<Icon type="share-alt" style={{fontSize: 30, color: '#722ed1'}} />}
            >
                <FormItem onSubmit={this.handleSubmit} hideRequiredMark>
                    <Card
                        bordered={false}
                        title={intl.formatMessage(messages.tableTitle)}
                    >
                        <div className={styles.tableList}>
                            <Button icon="rollback" type="primary" onClick={this.clickCancel}>
                                {intl.formatMessage(messages.buttonBack)}
                            </Button>
                            <Button icon="plus" type="primary" onClick={this.onInvitation} style={{ marginLeft: 8 }} >
                                {intl.formatMessage(messages.buttonInvite)}
                            </Button>

                            <Table
                                components={this.components}
                                className={styles.table}
                                loading={loadingInfo}
                                dataSource={OrgListInvited}
                                columns={columnsOrgSign}
                                pagination={paginationProps}
                                style={{ marginTop: 16 }}
                            />
                        </div>
                    </Card>
                </FormItem>
                <Modal
                    title={intl.formatMessage(messages.modelTitle)}
                    visible={this.state.modalVisible}
                    onOk={this.commitOrg}
                    onCancel={this.ModalCancel}
                    okText={intl.formatMessage(messages.buttonOk)}
                    cancelText={intl.formatMessage(messages.buttonCancel)}
                    confirmLoading={submitting}
                    destroyOnClose={true}
                >
                    <Row gutter={8}>
                        <Col span={7} style={{ align: 'right' }}>
                            <span style={{ align: 'right' }}>{intl.formatMessage(messages.modelLabel)}</span>
                        </Col>
                        <Col span={17} style={{ align: 'left' }}>
                            <Select
                                mode="multiple"
                                placeholder={intl.formatMessage(messages.modelInfo)}
                                onChange={this.onSelectOrgs}
                                style={{ width: '100%' }}
                            >
                                {this.state.orgList}
                            </Select>
                        </Col>
                    </Row>
                </Modal>
            </PageHeaderLayout>
        );
    }
}
