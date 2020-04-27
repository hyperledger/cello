import React, { PureComponent, Fragment } from 'react';
import { Resizable } from 'react-resizable';
import {defineMessages, IntlProvider,} from 'react-intl';
import { stringify } from 'qs';
import { routerRedux } from 'dva/router';
import { connect, } from 'dva';
import {
    Card,
    Form,
    Input,
    Button,
    Modal,
    Menu,
    message,
    Dropdown,
    Table,
    Icon,
    Select,
    Divider,
} from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import Ellipsis from '../../components/Ellipsis'
import styles from './ChainCodeList.less';
import { getLocale } from "../../utils/utils";

const messages = defineMessages({
    pageTitle:{
        id: 'ChainCode.Title.PageTitle',
        defaultMessage: 'ChainCode List',
    },
    pageDesc:{
        id: 'ChainCode.Label.PageDesc',
        defaultMessage: 'ChainCode is the code that defines business logic.Before using ChainCode to execute transactions,it is necessary to upload the ChainCode to the server, install it to the specified node, and instantiate the ChainCode.',
    },
    uploadChainCode:{
        id: 'ChainCode.UploadChainCode',
        defaultMessage: 'Upload ChainCode',
    },
    refresh:{
        id: 'ChainCode.Refresh',
        defaultMessage: 'Refresh',
    },
    name: {
        id: 'ChainCode.ListChainCodeName',
        defaultMessage: 'Name',
    },
    description: {
        id: 'ChainCode.ListChainCodeDescription',
        defaultMessage: 'Description',
    },
    version: {
        id: 'ChainCode.ListChainCodeVersion',
        defaultMessage: 'Version',
    },
    language: {
        id: 'ChainCode.ListChainCodeLanguage',
        defaultMessage: 'Code Language',
    },
    md5Value: {
        id: 'ChainCode.ListChainCodeMd5',
        defaultMessage: 'MD5 Value',
    },
    operation: {
        id: 'ChainCode.ListChainCodeOperation',
        defaultMessage: 'Operation',
    },
    details: {
        id: 'ChainCode.List.Details',
        defaultMessage: 'Details',
    },
    install: {
        id: 'ChainCode.List.Install',
        defaultMessage: 'Install',
    },
    instantiate: {
        id: 'ChainCode.List.Instantiate',
        defaultMessage: 'Instantiate',
    },
    more: {
        id: 'ChainCode.List.More',
        defaultMessage: 'More',
    },
    delete: {
        id: 'ChainCode.List.Delete',
        defaultMessage: 'Delete',
    },
    confirm: {
        id: 'ChainCode.List.Confirm',
        defaultMessage: 'Are you sure to delete the ChainCode {name}?',
    },
});

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

// 可调节边框
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
    const {
        modalVisible,
        form,
        handleAdd,
        catchOrg,
        fetchChannels,
        handleModalVisible,
        submitting,
        flag,
    } = props;

   // const role={name:"peer",mspId:OrgName};

    const allChannels = Array.isArray(fetchChannels) ? fetchChannels : [];    //获取通道信息选项
    const channelOptions = allChannels.map(channels => (
        <Option key={channels.id} value={channels.id}>
            <span>{channels.name}</span>
        </Option>
    ));



    const okHandle = () => {
        form.validateFields((err,fieldsValue) => {
            if (err) return;
         //   form.resetFields();
            handleAdd(fieldsValue);
        });
    };

    const onChangeChoose = (value) => {
        catchOrg(value);

    };

    return (!modalVisible ? '':
        <Modal
            title="实例化链码"
            visible={modalVisible}
            footer={false}
            closable={false}
           
        >
            <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="通道名称">
                {form.getFieldDecorator('channel_id', {
                    initialValue:'',
                    rules: [
                        {
                            required: true,
                            message: '请选择通道名称',
                        },
                    ],
                })(
                    <Select
                        placeholder="请选择通道"
                        style={{maxWidth: 510, width: '100%'}}
                        onChange={(value) => onChangeChoose(value)}
                    >
                        {channelOptions}
                    </Select>
                )}
            </FormItem>

            <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="参数" extra="必须使用','分隔各参数. 例如：a,100,b,200">
                {form.getFieldDecorator('args', {
                    initialValue: '',
                    rules: [
                        {   pattern: new RegExp("^[A-Za-z0-9]+[,A-Za-z0-9]*$"),
                            message: '必须使用\',\'分隔各参数.',
                        },
                    ],
                })(<Input placeholder="请输入参数" />)}
            </FormItem>

            <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="函数名" >
                {form.getFieldDecorator('functionName', {
                    initialValue: '',
                    rules: [
                        {
                            message: '选填',
                        },
                    ],
                })(<Input placeholder="函数名(选填)" />)}
            </FormItem>
            <Button onClick={() => handleModalVisible()} style={{marginLeft: 310}}>
                取消
            </Button>
            <Button loading={submitting} type="primary" htmlType="submit" onClick={okHandle} style={{marginLeft: 10}}>
                确定
            </Button>
        </Modal>
    );
});


@connect(({ ChainCodeList,ChannelList,InstantChainCode,Identities, loading }) => ({
    ChainCodeList,
    ChannelList,
    InstantChainCode,
    Identities,
    submitting:loading.effects['InstantChainCode/instantiate'],
    loading: loading.models.ChainCodeList,
}))
@Form.create()
export default class ChainCodeList extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            modalVisible:false,
            columns : [
                {
                    title: intl.formatMessage(messages.name),
                    dataIndex: 'name',
                    width: 110,
                    sorter: (a, b) => a.name.length - b.name.length,
                    render: val => <Ellipsis tooltip lines={1}>{val}</Ellipsis>,
                },
                {
                    title: intl.formatMessage(messages.description),
                    dataIndex: 'description',
                    width: 130,
                    render: val => <Ellipsis tooltip lines={1}>{val}</Ellipsis>,
                },
                {
                    title: intl.formatMessage(messages.version),
                    dataIndex: 'version',
                    width: 70,
                    sorter: (a, b) => a.version.length - b.version.length,
                },
                {
                    title: intl.formatMessage(messages.language),
                    dataIndex: 'language',
                    width: 70,
                    sorter: (a, b) => a.language.length - b.language.length,
                    render: val => <Ellipsis tooltip lines={1}>{val}</Ellipsis>,
                },
                {
                    title: intl.formatMessage(messages.md5Value),
                    dataIndex: 'md5',
                    width: 110,
                    sorter: (a, b) => a.MD5 - b.MD5,
                    render: val => <Ellipsis tooltip lines={1}>{val}</Ellipsis>,
                },
                {
                    title: intl.formatMessage(messages.operation),
                    width: 260,
                    render:  (row) => (
                        <Fragment>
                            <a size='small' type="primary" onClick={() => this.onChainCodeDetail(row)}>{intl.formatMessage(messages.details)}</a>
                            {window.localStorage["cello-authority"] === "operator" ? "" :
                                <nobr>
                                <Divider type="vertical" />
                                <a size='small' type="primary" onClick={() => this.onInstallChainCode(row)}>{intl.formatMessage(messages.install)}</a>
                                <Divider type="vertical" />
                                <a size='small' type="primary" onClick={() => this.onInstantiateChainCode(row)}>{intl.formatMessage(messages.instantiate)}</a>
                                <Divider type="vertical" />
                                <Dropdown
                                    overlay={
                                        <Menu >
                                            {/* <Menu.Item key="1"   onClick={() => this.onEidtChainCode(row)}>编辑</Menu.Item> */}
                                            <Menu.Item key="2"   onClick={() =>this.DeleteChainCode(row)} >{intl.formatMessage(messages.delete)}</Menu.Item>
                                        </Menu>
                                    }
                                >
                                    <a className="ant-dropdown-link" >{intl.formatMessage(messages.more)}<Icon type="down" /></a>
                                </Dropdown>
                            </nobr>
                            }
                        </Fragment>
                    ),
                },
            ],
        };
    }


    componentWillMount() {

        const { dispatch } = this.props;
        dispatch({
            type: 'ChainCodeList/fetch',
        });
        this.props.dispatch({
            type:'ChannelList/fetch',
        })
    }


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


    handleFormReset = () => {
        const { form, dispatch } = this.props;
        form.resetFields();
        this.setState({
            formValues: {},
        });
        dispatch({
            type: 'ChainCodeList/fetch',
            payload: {},
        });
    };

    /* handleSelectRows = rows => {
       this.setState({
         selectedRows: rows,
       });
     };  */


    handleModalVisible =(flag,id)  => {
        this.setState({
            modalVisible: !!flag,
            chaincode_id:id,
        });
    };


    catchOrg=(channelId)=>{
        const { dispatch } = this.props;
        dispatch({
            type: 'Identities/fetchOrgMsp',
            payload: {
                channelId,   //链码ID值
            },
        });
    };


    handleAdd = (fields) => {
        const { dispatch } = this.props;
        dispatch({
            type: 'InstantChainCode/instantiate',
            payload: {
                 id:this.state.chaincode_id,   //链码ID值
                instantiate: fields,
            },
        });
     /*   this.setState({
            modalVisible: true,
        });  */
    };

    upLoadChainCode = () =>{
        this.props.dispatch(
            routerRedux.push({
                pathname: 'upLoadChainCode',
                /*
                search: stringify({
                  action: 'create',
                }),*/
            })
        )

    };


    onChainCodeDetail =(row) => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'ChainCodeDetail',
                search: stringify({
                    id: row.id,
                })

            })
        )
    };

    onInstallChainCode =(row) => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'InstallChainCode',
                search: stringify({
                    id: row.id,
                })
            })
        )
    };

    onInstantiateChainCode=(row) => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'Instantiate',
                search: stringify({
                    id: row.id,
                })
            })
        )
    };

    onEidtChainCode =(row) => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'upLoadChainCode',
                search: stringify({
                    id: row.id,
                    action: 'edit',

                })
            })
        )
    };


    DeleteChainCode=(row)=> {
        /* const { selectedRows } = this.state; */
        const { dispatch } = this.props;
        const name = row.name;
        Modal.confirm({
            title: intl.formatMessage(messages.confirm,{name}),
            onOk() {
                dispatch({
                    type: 'ChainCodeList/removeChainCode',
                    payload: {
                        id: row.id,
                        /*  no: selectedRows.map(row => row.no).join(','),*/
                    },
                });
            },
        });
    };


    cleanInstant=()=>{
        if (this.props.InstantChainCode.Instant) {
            this.props.InstantChainCode.Instant = null;
            this.setState({modalVisible: false})
        }
    };

    remove(key) {
        const { data } = this.state;
        const { onChange } = this.props;
        const newData = data.filter(item => item.key !== key);
        this.setState({ data: newData });
        onChange(newData);
    }


    render() {
        const {
            ChainCodeList: { chaincodes },
            ChannelList:{channels},
            loading,
            submitting,
        } = this.props;
        this.cleanInstant();
        const {  modalVisible } = this.state;
        const ChainCodes = Array.isArray(chaincodes.chaincodes) ? chaincodes.chaincodes : [];
        const paginationProps = {
            showSizeChanger: true,
            showQuickJumper: true,
        };


        const parentMethods = {
            handleAdd: this.handleAdd,
            catchOrg:this.catchOrg,
            handleModalVisible: this.handleModalVisible,
            fetchChannels:channels,
           // flag:Instant,
            submitting:submitting,
        };


        const columns = this.state.columns.map((col, index) => ({
            ...col,
            onHeaderCell: column => ({
                width: column.width,
                onResize: this.handleResize(index),
            }),
        }));

        return (
            <PageHeaderLayout title={intl.formatMessage(messages.pageTitle)}
                              content={intl.formatMessage(messages.pageDesc)}
                              logo={<Icon type="link" style={{fontSize: 30, color: '#722ed1'}} />}
            >
                <Card bordered={false}>
                    <div className={styles.tableList}>
                        <div className={styles.tableListOperator}>
                            {window.localStorage["cello-authority"] === "operator" ? "" :
                                <Button icon="plus" type="primary" onClick={this.upLoadChainCode}>
                                    {intl.formatMessage(messages.uploadChainCode)}
                                </Button>
                            }
                            <Button icon="sync" type="primary" style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
                                {intl.formatMessage(messages.refresh)}
                            </Button>
                        </div>
                        <div className={styles.standardTable}>
                            <Table
                                components={this.components}
                                className={styles.table}
                                loading={loading}
                                columns={columns}
                                dataSource={ChainCodes}
                                pagination={paginationProps}
                                onChange={this.handleTableChange}
                            />
                        </div>
                    </div>
                </Card>
                <CreateForm {...parentMethods} modalVisible={modalVisible} />
            </PageHeaderLayout>
        );
    }
}
