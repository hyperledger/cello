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
import styles from './LeaveChannel.less';
import { Resizable } from 'react-resizable';
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from "../../utils/utils";

const messages = defineMessages({
    pageTitle: {
        id: 'Channel.LeaveChannel.pageTitle',
        defaultMessage: 'Exit Channel',
    },
    pageDesc: {
        id: 'Channel.LeaveChannel.pageDesc',
        defaultMessage: 'You can apply on this page and exit the current channel. If you want to exit the current channel successfully, you must agree, otherwise others can\'t delete your organization from the channel.',
    },
    tableTitle: {
        id: 'Channel.LeaveChannel.tableTitle',
        defaultMessage: 'Organizations Applying For Exit The Channel',
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
    buttonApply: {
        id: 'Channel.LeaveChannel.buttonApply',
        defaultMessage: 'Apply To Exit',
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
        id: 'Channel.LeaveChannel.Check',
        defaultMessage: 'Do you confirm your consent to the organization\'s exit from the current channel?'
    },
    modelTitle: {
        id: 'Channel.LeaveChannel.ModalTitle',
        defaultMessage: 'Apply For Exit Channel',
    },
    modelInfo: {
        id: 'Channel.LeaveChannel.ModalLabel',
        defaultMessage: 'If you exit the channel successfully, you will no longer be able to participate in any transactions in the channel. Please confirm whether to apply?',
    }
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

@connect(({ LeaveChannel,loading }) => ({
    LeaveChannel,
    loading: loading.models.LeaveChannel,
    submitting: loading.effects['LeaveChannel/apply']
}))
@Form.create()
export default class LeaveChannel extends PureComponent {
    state = {
        modalVisible: false,
        expandForm: false,
        selectedRows: [],
        formValues: {},
    };

    componentDidMount() {
        const { dispatch } = this.props;
        const location = this.props.location;
        const search = new URLSearchParams(location.search);
        const channelId = search.get('id');
         dispatch({
             type: 'LeaveChannel/fetch',
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

    onApply = () =>{
        this.setState({
            modalVisible: true,
        })
    };

    ModalCancel = () => {
        this.setState({
            modalVisible: false,
        })
    };

    commitOrg = () => {
        const { dispatch } = this.props;
        const location = this.props.location;
        const search = new URLSearchParams(location.search);
        const channelId = search.get('id');

        dispatch({
            type: 'LeaveChannel/apply',
            payload: {
                channelId: channelId,
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
            type: 'LeaveChannel/agree',
            payload: {
                channelId: channelId,
                peer_org: id,
                dispatch: dispatch
            }
        });
    };

    render() {
        const {
            LeaveChannel: { OrgListApplied },
            loadingInfo,
            submitting,
            LeaveChannel: { iApplied }
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

        return (
            <PageHeaderLayout title={intl.formatMessage(messages.pageTitle)}   content={intl.formatMessage(messages.pageDesc)}
                              logo={<Icon type="share-alt" style={{fontSize: 30, color: '#722ed1'}} />}
            >
                <FormItem hideRequiredMark>
                    <Card
                        bordered={false}
                        title={intl.formatMessage(messages.tableTitle)}
                    >
                        <div className={styles.tableList}>
                            <Button icon="rollback" type="primary" onClick={this.clickCancel}>
                                {intl.formatMessage(messages.buttonBack)}
                            </Button>
                            {
                                iApplied ? '' :
                                    <Button icon="minus" type="primary" onClick={this.onApply} style={{ marginLeft: 8 }} >
                                        {intl.formatMessage(messages.buttonApply)}
                                    </Button>
                            }
                            
                            <Table
                                components={this.components}
                                className={styles.table}
                                loading={loadingInfo}
                                dataSource={OrgListApplied}
                                columns={columnsOrgSign}
                                pagination={paginationProps}
                                style={{ marginTop: 16 }}
                            />
                        </div>
                    </Card>
                </FormItem>
                {
                    <Modal
                        title={intl.formatMessage(messages.modelTitle)}
                        visible={this.state.modalVisible}
                        onOk={this.commitOrg}
                        onCancel={this.ModalCancel}
                        okText={intl.formatMessage(messages.buttonOk)}
                        cancelText={intl.formatMessage(messages.buttonCancel)}
                        confirmLoading={submitting}
                    >
                        <div>
                            <span>
                                {intl.formatMessage(messages.modelInfo)}
                            </span>
                        </div>
                    </Modal>
                }
            </PageHeaderLayout>
        );
    }
}
