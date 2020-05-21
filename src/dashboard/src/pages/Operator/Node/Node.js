/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent, Fragment } from 'react';
import { connect, history, useIntl, injectIntl } from 'umi';
import {
  Card,
  Button,
  Modal,
  message,
  Divider,
  Menu,
  Dropdown,
  Icon,
  Form,
  Input,
  Select,
  Badge,
} from 'antd';
import moment from 'moment';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import StandardTable from '@/components/StandardTable';
import styles from '../styles.less';
import { getAuthority } from '@/utils/authority';

const FormItem = Form.Item;
const { Option } = Select;

const RegisterUserForm = Form.create()(props => {
  const {
    registerUserFormVisible,
    form,
    handleSubmit,
    handleModalVisible,
    registeringUser,
    targetNodeId,
  } = props;
  const onSubmit = () => {
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      const values = { ...fieldsValue };
      if (values.attrs === '') {
        delete values.attrs;
      }
      const body = {
        id: targetNodeId,
        message: values,
      };
      handleSubmit(body);
    });
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
  const intl = useIntl();

  return (
    <Modal
      destroyOnClose
      title={
        intl.formatMessage({ id: 'app.operator.node.table.operation.registerUser', defaultMessage: 'Register User' })
      }
      visible={registerUserFormVisible}
      confirmLoading={registeringUser}
      width="30%"
      onOk={onSubmit}
      onCancel={() => handleModalVisible()}
    >
      <FormItem
        {...formItemLayout}
        label={intl.formatMessage({
          id: 'app.operator.node.modal.label.name',
          defaultMessage: 'User name',
        })}
      >
        {form.getFieldDecorator('name', {
          initialValue: '',
          rules: [
            {
              required: true,
              message: (
                intl.formatMessage({ id: 'app.operator.node.modal.required.name', defaultMessage: 'Please input user name.' })
              ),
            },
          ],
        })(
          <Input
            placeholder={intl.formatMessage({
              id: 'app.operator.node.modal.label.name',
              defaultMessage: 'User name',
            })}
          />
        )}
      </FormItem>
      <FormItem
        {...formItemLayout}
        label={intl.formatMessage({
          id: 'app.operator.node.modal.label.secret',
          defaultMessage: 'Password',
        })}
      >
        {form.getFieldDecorator('secret', {
          initialValue: '',
          rules: [
            {
              required: true,
              message: (
                intl.formatMessage({ id: 'app.operator.node.modal.required.secret', defaultMessage: 'Please input password.' })
              ),
            },
          ],
        })(
          <Input
            placeholder={intl.formatMessage({
              id: 'app.operator.node.modal.label.secret',
              defaultMessage: 'Password',
            })}
          />
        )}
      </FormItem>
      <FormItem
        {...formItemLayout}
        label={intl.formatMessage({
          id: 'app.operator.node.modal.label.type',
          defaultMessage: 'Type',
        })}
      >
        {form.getFieldDecorator('user_type', {
          initialValue: userTypeValues[0],
          rules: [
            {
              required: true,
              message: (
                intl.formatMessage({ id: 'app.operator.node.modal.required.type', defaultMessage: 'Please select a type.' })
              ),
            },
          ],
        })(<Select style={{ width: '100%' }}>{userTypeOptions}</Select>)}
      </FormItem>
      <FormItem
        {...formItemLayout}
        label={intl.formatMessage({
          id: 'app.operator.node.modal.label.attributes',
          defaultMessage: 'Attributes',
        })}
      >
        {form.getFieldDecorator('attrs', {
          initialValue: '',
        })(
          <Input
            placeholder={intl.formatMessage({
              id: 'app.operator.node.modal.label.attributes',
              defaultMessage: 'Attributes',
            })}
          />
        )}
      </FormItem>
    </Modal>
  );
});

@connect(({ node, loading }) => ({
  node,
  loadingNodes: loading.effects['node/listNode'],
  registeringUser: loading.effects['node/registerUserToNode'],
}))
@Form.create()
class Node extends PureComponent {
  state = {
    selectedRows: [],
    formValues: {},
    registerUserFormVisible: false,
    targetNodeId: '',
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
          defaultMessage: 'Confirm to delete the node {name}?',
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

  render() {
    const { selectedRows, registerUserFormVisible, targetNodeId } = this.state;

    const userRole = getAuthority()[0];

    const {
      node: { nodes, pagination },
      loadingNodes,
      registeringUser,
      intl,
    } = this.props;

    const formProps = {
      registerUserFormVisible,
      handleSubmit: this.handleSubmit,
      handleModalVisible: this.handleModalVisible,
      registeringUser,
      targetNodeId,
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
        case 'error':
          statusOfBadge = 'error';
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
              {intl.formatMessage({ id: 'app.operator.node.table.operation.registerUser', defaultMessage: 'Register User' })}
            </a>
          </Menu.Item>
        )}
        <Menu.Item>
          <a onClick={() => this.operationForNode('start', record)}>
            {intl.formatMessage({ id: 'app.operator.node.table.operation.start', defaultMessage: 'Start' })}
          </a>
        </Menu.Item>
        <Menu.Item>
          <a onClick={() => this.operationForNode('stop', record)}>
            {intl.formatMessage({ id: 'app.operator.node.table.operation.stop', defaultMessage: 'Stop' })}
          </a>
        </Menu.Item>
        <Menu.Item>
          <a onClick={() => this.operationForNode('restart', record)}>
            {intl.formatMessage({ id: 'app.operator.node.table.operation.restart', defaultMessage: 'Restart' })}
          </a>
        </Menu.Item>
      </Menu>
    );

    const MoreBtn = record => (
      <Dropdown overlay={menu(record)}>
        <a>
          {intl.formatMessage({ id: 'app.operator.node.table.operation.more', defaultMessage: 'More' })}{' '}
          <Icon type="down" />
        </a>
      </Dropdown>
    );

    const columns = [
      {
        title: intl.formatMessage({ id: 'app.operator.node.table.header.name', defaultMessage: 'Name' }),
        dataIndex: 'name',
      },
      {
        title: intl.formatMessage({ id: 'app.operator.node.table.header.type', defaultMessage: 'Type' }),
        dataIndex: 'type',
      },
      {
        title: (
          intl.formatMessage({ id: 'app.operator.node.table.header.creationTime', defaultMessage: 'Creation Time' })
        ),
        dataIndex: 'created_at',
        render: text => <span>{moment(text).format('YYYY-MM-DD HH:mm:ss')}</span>,
      },
      {
        title: (
          intl.formatMessage({ id: 'app.operator.node.table.header.status', defaultMessage: 'Status' })
        ),
        render: text => (
          <Badge
            status={badgeStatus(text)}
            text={intl.formatMessage({
              id: `app.operator.node.status.${text}`,
            })}
          />
        ),
        dataIndex: 'status',
      },
      {
        title: intl.formatMessage({ id: 'form.table.header.operation', defaultMessage: 'Operation' }),
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
        title={
          intl.formatMessage({ id: 'app.operator.node.title', defaultMessage: 'Node Management' })
        }
      >
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListOperator}>
              {userRole !== 'operator' && (
                <Button
                  icon="plus"
                  type="primary"
                  onClick={() => history.push('/operator/node/new')}
                >
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
      </PageHeaderWrapper>
    );
  }
}

export default injectIntl(Node);
