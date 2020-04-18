import React, { Component,Fragment } from 'react';
import moment from 'moment';
import {
    Card,
    Badge,
    Table,
    Button,
    Icon,
    Form,
    Row,
    Col,
    Input,
    Radio,
} from 'antd';
import StandardTableInstantList from '../../components/StandardTableInstantList';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import StandardFormRow from '../../components/StandardFormRow';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './ChainCodeList.less';
const FormItem = Form.Item;
/*const operationTabList = [
  {
    key: 'newOperations',
    tab: 'History of create new code',
  },
];  */

@connect(({InstantChainCode, smartContract,loading }) => ({
    InstantChainCode,
    smartContract,
    loading: loading.models.InstantChainCode,
}))


@Form.create()
export default class ChainCodeState extends Component {
    state = {
        operationKey: 'newOperations',
    };

    componentDidMount() {
        /*  const { dispatch } = this.props;
          dispatch({
            type: 'smartContract/fetch',
          });  */
    }

    onOperationTabChange = key => {
        this.setState({ operationKey: key });
    };

    clickCancel = () => {
        this.props.dispatch(
            routerRedux.push({
                pathname: 'ChainCodeList',
            })
        );
    };

    handleSubmit = e => {
        const { onSubmit, operation } = this.props;
        e.preventDefault();
        this.props.form.validateFieldsAndScroll({ force: true }, (err, values) => {
            if (!err) {
                onSubmit({
                    ...values,
                    operation,
                });
            }
        });
    };


    render() {
        const { form,codes,loading, loadingInfo,newOperations,submitting,result,InstantChainCode: { Instant}, } = this.props;
        const {getFieldDecorator}=form;
        const codeColumns = [
            {
                title: '序号',
                dataIndex: '序号',
                key: 'version',
            },
            {
                title: '实例化链码',
                dataIndex: '实例化链码',
                key: 'createTime',
            },
            {
                title: '版本',
                dataIndex: 'version',
                key: 'version',
            },
            {
                title: 'MD5值',
                dataIndex: 'MD5',
                key: 'MD5',
            },
            /* {
               title: '实例化链码操作',
               render: ( text, record ) => (
                 <Fragment>
                   <a onClick={() => onDeploy(record)}>Deploy</a>
                   <Divider type="vertical" />
                   <a style={{color: 'red'}}>Delete</a>
                 </Fragment>
               ),
             },  */
        ];
        /*  const contentList = {
          newOperations: (
             <Table
               pagination={false}
               loading={loading}
               columns={newOperationColumns}
               dataSource={newOperations}
             />
           ),
        };*/

        return (
            <PageHeaderLayout title="链码状态" logo={<Icon type="dashboard" style={{fontSize: 30, color: '#722ed1'}} />}  >
                <Fragment>
                    <StandardFormRow>
                        <Card
                            title="实例化链码"
                            bordered={false}
                        >
                            <Form onSubmit={this.handleSubmit}>
                                <div className={styles.tableList}>
                                    <div className={styles.tableListOperator}>

                                        <StandardTableInstantList
                                            pagination={false}
                                            loading={loading}
                                            columns={codeColumns}
                                            data={Instant}
                                        />
                                    </div>
                                    <div className={styles.tableListForm}>
                                        <Col md={10} sm={24} >
                                            <FormItem  label="操作">
                                                <Radio.Group >
                                                    <Radio style={{ fontSize: 20, marginLeft: 50 }} value="invoke">invoke</Radio>
                                                    <Radio style={{fontSize: 20, marginLeft: 50 }} value="query">query</Radio>
                                                </Radio.Group>
                                            </FormItem>
                                        </Col>
                                        <Col md={10} sm={24}>
                                            <FormItem
                                                label="Arguments"
                                                extra="必须使用','分隔各参数."
                                            >
                                                {getFieldDecorator('args', {
                                                    initialValue: '',
                                                    rules: [
                                                        {
                                                            required: true,
                                                            message: '必须使用\',\'分隔各参数.',
                                                        },
                                                    ],
                                                })(<Input placeholder="Arguments" />)}
                                            </FormItem>
                                        </Col>
                                        <Col md={4} sm={24}>
                                            <span className={styles.submitButtons}>
                                              <Button type="primary" htmlType="submit" style={{ marginLeft: 20 }} loading={submitting}>
                                                确定
                                              </Button>
                                            </span>
                                        </Col>
                                    </div>
                                </div>
                            </Form>
                        </Card>
                    </StandardFormRow>
                    <Card
                        title="查询结果"
                        bordered={false}
                        style={{ marginTop: 24 }}
                        bodyStyle={{ padding: '8px 32px 32px 32px' }}
                        loading={submitting}
                    >
                        {result}
                    </Card>
                    <Button icon="rollback" type="primary" style={{ marginTop: 50 }} onClick={this.clickCancel}>
                        返回
                    </Button>
                </Fragment>
            </PageHeaderLayout>
        );
    }
}
