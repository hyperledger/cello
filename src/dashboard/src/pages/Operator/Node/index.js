/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent, Fragment } from 'react';
import { connect, history, injectIntl, useIntl } from 'umi';
import {
  Card,
  Button,
  Modal,
  message,
  Divider,
  Menu,
  Dropdown,
  Form,
  Input,
  Select,
  InputNumber,
  Badge
} from 'antd';
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import moment from 'moment';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import StandardTable from '@/components/StandardTable';
import { getAuthority } from '@/utils/authority';
import styles from '../styles.less';

const FormItem = Form.Item;
const { Option } = Select;

const RegisterUserForm = props => {
  const {
    registerUserFormVisible,
    handleSubmit,
    handleModalVisible,
    registeringUser,
    targetNodeId,
    intl,
  } = props;
  const [form] = Form.useForm();
  const onFinish = values => {
    if (values.attrs === '') {
      // eslint-disable-next-line no-param-reassign
      delete values.attrs;
    }
    const body = {
      id: targetNodeId,
      message: values,
    };
    handleSubmit(body);
  };
  const onSubmit = () => {
    form.submit();
  };
  const userTypeValues = ['peer', 'orderer', 'user'];
  const userTypeOptions = userTypeValues.map(item => (
    <Option value={item} key={item}>
      <span>{item}</span>
    </Option>
  ));
  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 8 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 16 },
      md: { span: 10 },
    },
  };

  return (
    <Modal
      destroyOnClose
      title={intl.formatMessage({
        id: 'app.operator.node.table.operation.registerUser',
        defaultMessage: 'Register User',
      })}
      visible={registerUserFormVisible}
      confirmLoading={registeringUser}
      width="30%"
      onOk={onSubmit}
      onCancel={() => handleModalVisible()}
    >
      <Form
        form={form}
        onFinish={onFinish}
        initialValues={{
          name: '',
        }}
      >
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.node.modal.label.name',
            defaultMessage: 'User name',
          })}
          name="name"
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'app.operator.node.modal.required.name',
                defaultMessage: 'Please input user name.',
              }),
            },
          ]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'app.operator.node.modal.label.name',
              defaultMessage: 'User name',
            })}
          />
        </FormItem>
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.node.modal.label.secret',
            defaultMessage: 'Password',
          })}
          name="secret"
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'app.operator.node.modal.required.secret',
                defaultMessage: 'Please input password.',
              }),
            },
          ]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'app.operator.node.modal.label.secret',
              defaultMessage: 'Password',
            })}
          />
        </FormItem>
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.node.modal.label.type',
            defaultMessage: 'Type',
          })}
          name="user_type"
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'app.operator.node.modal.required.type',
                defaultMessage: 'Please select a type.',
              }),
            },
          ]}
        >
          <Select style={{ width: '100%' }}>{userTypeOptions}</Select>
        </FormItem>
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.node.modal.label.attributes',
            defaultMessage: 'Attributes',
          })}
          name="attr"
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'app.operator.node.modal.label.attributes',
              defaultMessage: 'Attributes',
            })}
          />
        </FormItem>
      </Form>
    </Modal>
  );
};

const CreateNode = props => {
  const [form] = Form.useForm();
  const intl = useIntl();
  const { createModalVisible, handleCreate, handleModalVisible, creating, queryNodeList } = props;

  const createCallback = response => {
    if (response.status !== 'successful') {
      message.error(intl.formatMessage({
        id: 'app.operator.node.new.createFail',
        defaultMessage: 'Create node failed',
      }));
    }
    else {
      message.success(intl.formatMessage({
        id: 'app.operator.node.new.createSuccess',
        defaultMessage: 'Create node succeed',
      }));
      form.resetFields();
      handleModalVisible();
      queryNodeList();
    }
  };

  const onSubmit = () => {
    form.submit();
  };

  const onFinish = values => {
    handleCreate(values, createCallback);
  };

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 7 }
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 12 },
      md: { span: 10 }
    }
  };

  const types = ['ca', 'orderer', 'peer'];
  const typeOptions = types.map(item => (
    <Option value={item} key={item}>
      <span style={{color: '#8c8f88'}}>{item}</span>
    </Option>
  ));

  return(
    <Modal
      destroyOnClose
      title={intl.formatMessage({
        id: 'app.operator.node.new.title',
        defaultMessage: 'Create Node',
      })}
      confirmLoading={ creating }
      visible={ createModalVisible }
      onOk={ onSubmit }
      onCancel={() => handleModalVisible(false) }
    >
      <Form
        onFinish={ onFinish }
        form={form}
        preserve={false}
      >
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.node.new.name',
            defaultMessage: 'Name',
          })}
          name="name"
          initialValue=''
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'app.operator.node.new.nameCheck',
                defaultMessage: 'Please enter node name',
              }),
            },
          ]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'app.operator.node.new.name',
              defaultMessage: 'Name',
            })}
          />
        </FormItem>
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.node.new.type',
            defaultMessage: 'Type',
          })}
          name="type"
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'app.operator.node.new.typeCheck',
                defaultMessage: 'Please select a type',
              }),
            },
          ]}
        >
          <Select defaultActiveFirstOption={false} >{typeOptions}</Select>
        </FormItem>
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.node.new.num',
            defaultMessage: 'Number',
          })}
          name="num"
          initialValue='1'
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'app.operator.node.new.numCheck',
                defaultMessage: 'Please enter the number of nodes',
              }),
            },
          ]}
        >
          <InputNumber
            placeholder={intl.formatMessage({
              id: 'app.operator.node.new.num',
              defaultMessage: 'Number',
            })}
            min={1}
            style={{width: '100%'}}
          />
        </FormItem>
      </Form>
    </Modal>
  );
};

@connect(({ node, loading }) => ({
  node,
  loadingNodes: loading.effects['node/listNode'],
  registeringUser: loading.effects['node/registerUserToNode'],
  creating: loading.effects['node/createNode']
}))
class Index extends PureComponent {
  state = {
    selectedRows: [],
    formValues: {},
    registerUserFormVisible: false,
    targetNodeId: '',
    createModalVisible: false,
  };

  componentDidMount() {
    this.queryNodeList();
  }

  componentWillUnmount() {
    const { dispatch } = this.props;

    dispatch({
      type: 'node/clear',
    });
  }

  queryNodeList = () => {
    const {
      dispatch,
      node: { pagination },
    } = this.props;
    const { formValues } = this.state;

    dispatch({
      type: 'node/listNode',
      payload: {
        ...formValues,
        per_page: pagination.pageSize,
        page: pagination.current,
      },
    });
  };

  handleSelectRows = rows => {
    this.setState({
      selectedRows: rows,
    });
  };

  handleTableChange = pagination => {
    const { dispatch } = this.props;
    const { formValues } = this.state;
    const { current, pageSize } = pagination;
    const params = {
      page: current,
      per_page: pageSize,
      ...formValues,
    };
    dispatch({
      type: 'node/listNode',
      payload: params,
    });
  };

  registerUserCallback = () => {
    const { intl } = this.props;
    message.success(
      intl.formatMessage({
        id: 'app.operator.node.modal.success',
        defaultMessage: 'Registered User Successful.',
      })
    );
    this.handleModalVisible();
  };

  handleModalVisible = visible => {
    this.setState({
      registerUserFormVisible: !!visible,
    });
  };

  handleRegisterUser = row => {
    this.setState({
      targetNodeId: row.id,
    });
    this.handleModalVisible(true);
  };

  handleSubmit = values => {
    const { dispatch } = this.props;

    dispatch({
      type: 'node/registerUserToNode',
      payload: values,
      callback: this.registerUserCallback,
    });
  };

  deleteCallBack = () => {
    const { intl } = this.props;
    message.success(
      intl.formatMessage({
        id: 'app.operator.node.delete.success',
        defaultMessage: 'Delete Node Successful.',
      })
    );
    this.queryNodeList();
  };

  handleDeleteNode = row => {
    const { dispatch, intl } = this.props;
    const { deleteCallBack } = this;
    const { id } = row;

    Modal.confirm({
      title: intl.formatMessage({
        id: 'app.operator.node.delete.title',
        defaultMessage: 'Delete Node',
      }),
      content: intl.formatMessage(
        {
          id: 'app.operator.node.delete.confirm',
          defaultMessage: 'Deleting node {name} may cause abnormality in the blockchain network. Confirm delete?',
        },
        {
          name: row.name,
        }
      ),
      okText: intl.formatMessage({ id: 'form.button.confirm', defaultMessage: 'Confirm' }),
      cancelText: intl.formatMessage({ id: 'form.button.cancel', defaultMessage: 'Cancel' }),
      onOk() {
        dispatch({
          type: 'node/deleteNode',
          payload: id,
          callback: deleteCallBack,
        });
      },
    });
  };

  operationForNodeCallback = data => {
    const { intl } = this.props;
    message.success(
      intl.formatMessage({
        id: `app.operator.node.operation.${data.payload.message}.success`,
        defaultMessage: `${data.payload.message.substring(0, 1).toUpperCase() +
          data.payload.message.substring(1)} Node Successful.`,
      })
    );
    this.queryNodeList();
  };

  operationForNode = (action, row) => {
    const { dispatch } = this.props;

    dispatch({
      type: 'node/operateNode',
      payload: {
        id: row.id,
        message: action,
      },
      callback: this.operationForNodeCallback,
    });
  };

  handleCreateModalVisible = visible => {
    this.setState({
      createModalVisible: !!visible
    });
  };

  handleCreate = ( values, callback ) => {
    const { dispatch } = this.props;

    dispatch({
      type: 'node/createNode',
      payload: values,
      callback
    });
  };

  render() {
    const { selectedRows, registerUserFormVisible, targetNodeId, createModalVisible } = this.state;

    const userRole = getAuthority()[0];

    const {
      node: { nodes, pagination },
      loadingNodes,
      registeringUser,
      intl,
      creating
    } = this.props;

    const formProps = {
      registerUserFormVisible,
      handleSubmit: this.handleSubmit,
      handleModalVisible: this.handleModalVisible,
      registeringUser,
      targetNodeId,
      intl,
    };

    const createFormProps = {
      createModalVisible,
      handleCreate: this.handleCreate,
      handleModalVisible: this.handleCreateModalVisible,
      creating,
      intl,
      queryNodeList: this.queryNodeList
    };

    function badgeStatus(status) {
      let statusOfBadge = 'default';
      switch (status) {
        case 'running':
          statusOfBadge = 'success';
          break;
        case 'deploying':
          statusOfBadge = 'processing';
          break;
        case 'deleting':
          statusOfBadge = 'processing';
          break;
        case 'stopped':
          statusOfBadge = 'warning';
          break;
        default:
          break;
      }

      return statusOfBadge;
    }

    const menu = record => (
      <Menu>
        {record.type === 'ca' && (
          <Menu.Item>
            <a onClick={() => this.handleRegisterUser(record)}>
              {intl.formatMessage({
                id: 'app.operator.node.table.operation.registerUser',
                defaultMessage: 'Register User',
              })}
            </a>
          </Menu.Item>
        )}
        {
          record.status === 'stopped' &&
          <Menu.Item>
            <a onClick={() => this.operationForNode('start', record)}>
              {intl.formatMessage({
                id: 'app.operator.node.table.operation.start',
                defaultMessage: 'Start',
              })}
            </a>
          </Menu.Item>
        }
        {
          record.status === 'running' &&
          <Menu.Item>
            <a onClick={() => this.operationForNode('stop', record)}>
              {intl.formatMessage({
                id: 'app.operator.node.table.operation.stop',
                defaultMessage: 'Stop',
              })}
            </a>
          </Menu.Item>
        }
        {
          record.status === 'stopped' &&
          <Menu.Item>
            <a onClick={() => this.operationForNode('restart', record)}>
              {intl.formatMessage({
                id: 'app.operator.node.table.operation.restart',
                defaultMessage: 'Restart',
              })}
            </a>
          </Menu.Item>
        }
      </Menu>
    );

    const MoreBtn = record => (
      <Dropdown overlay={menu(record)}>
        <a>
          {intl.formatMessage({
            id: 'app.operator.node.table.operation.more',
            defaultMessage: 'More',
          })}{' '}
          <DownOutlined />
        </a>
      </Dropdown>
    );

    const columns = [
      {
        title: intl.formatMessage({
          id: 'app.operator.node.table.header.name',
          defaultMessage: 'Name',
        }),
        dataIndex: 'name',
      },
      {
        title: intl.formatMessage({
          id: 'app.operator.node.table.header.type',
          defaultMessage: 'Type',
        }),
        dataIndex: 'type',
      },
      {
        title: intl.formatMessage({
          id: 'app.operator.node.table.header.creationTime',
          defaultMessage: 'Creation Time',
        }),
        dataIndex: 'created_at',
        render: text => <span>{moment(text).format('YYYY-MM-DD HH:mm:ss')}</span>,
      },
      {
        title: intl.formatMessage({
          id: 'app.operator.node.table.header.status',
          defaultMessage: 'Status',
        }),
        dataIndex: 'status',
        render: text => <Badge status={badgeStatus(text)} text={text} />,
      },
      {
        title: intl.formatMessage({
          id: 'form.table.header.operation',
          defaultMessage: 'Operation',
        }),
        render: (text, record) => (
          <Fragment>
            <a className={styles.danger} onClick={() => this.handleDeleteNode(record)}>
              {intl.formatMessage({ id: 'form.menu.item.delete', defaultMessage: 'Delete' })}
            </a>
            <Divider type="vertical" />
            <MoreBtn {...record} />
          </Fragment>
        ),
      },
    ];

    return (
      <PageHeaderWrapper
        title={intl.formatMessage({
          id: 'app.operator.node.title',
          defaultMessage: 'Node Management',
        })}
      >
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListOperator}>
              {userRole !== 'operator' && (
                <Button type="primary" onClick={() => this.handleCreateModalVisible(true)}>
                  <PlusOutlined />
                  {intl.formatMessage({ id: 'form.button.new', defaultMessage: 'New' })}
                </Button>
              )}
            </div>
            <StandardTable
              selectedRows={selectedRows}
              loading={loadingNodes}
              rowKey="id"
              data={{
                list: nodes,
                pagination,
              }}
              columns={columns}
              onSelectRow={this.handleSelectRows}
              onChange={this.handleTableChange}
            />
          </div>
        </Card>
        <RegisterUserForm {...formProps} />
        <CreateNode {...createFormProps} />
      </PageHeaderWrapper>
    );
  }
}

export default injectIntl(Index);
