/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import {
  Card,
  Button,
  Form,
  Modal,
  Input,
  Select,
  message,
  Dropdown,
  Icon,
  Menu,
  AutoComplete,
} from 'antd';
import moment from 'moment';
import { FormattedMessage, formatMessage } from 'umi-plugin-react/locale';
import isEmail from 'validator/lib/isEmail';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import StandardTable from '@/components/StandardTable';
import { getAuthority } from '@/utils/authority';
import styles from './styles.less';

const FormItem = Form.Item;
const Option = Select.Option;
const AutoCompleteOption = AutoComplete.Option;
const userRole = getAuthority()[0];

const CreateUpdateForm = Form.create()(props => {
  const {
    visible,
    form,
    method,
    handleSubmit,
    handleModalVisible,
    confirmLoading,
    user,
    organizations,
    onSearchOrganization,
  } = props;
  const { getFieldValue } = form;
  const onSubmit = () => {
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      handleSubmit(method, fieldsValue, user);
    });
  };

  const validateEmail = (rule, value, callback) => {
    if (value && !isEmail(value)) {
      callback(
        formatMessage({
          id: 'app.operator.user.form.email.noValid',
          defaultMessage: 'Please input valid email',
        })
      );
    }
    callback();
  };
  const organizationOptions = organizations.map(org => (
    <AutoCompleteOption key={org.id}>{org.name}</AutoCompleteOption>
  ));
  const onSelectOrganization = value => {
    form.setFieldsValue({
      organization: value,
    });
  };

  const validatePasswordConfirm = (rule, value, callback) => {
    if (value && getFieldValue('password') !== value) {
      callback(
        formatMessage({
          id: 'app.operator.user.form.passwordConfirm.noValid',
          defaultMessage: 'Inconsistent password input twice',
        })
      );
    }
    callback();
  };

  return (
    <Modal
      destroyOnClose
      title={
        <FormattedMessage
          id={`app.operator.user.form.${method === 'create' ? 'new' : 'update'}.title`}
          defaultMessage="New User"
        />
      }
      visible={visible}
      confirmLoading={confirmLoading}
      width="50%"
      onOk={onSubmit}
      onCancel={() => handleModalVisible()}
    >
      <FormItem
        labelCol={{ span: 5 }}
        wrapperCol={{ span: 15 }}
        label={formatMessage({
          id: 'app.operator.user.form.name.label',
          defaultMessage: 'User Name',
        })}
      >
        {form.getFieldDecorator('username', {
          initialValue: method === 'create' ? '' : user.username,
          rules: [
            {
              required: true,
              message: formatMessage({
                id: 'app.operator.user.form.name.required',
                defaultMessage: 'Please input user name',
              }),
              min: 1,
            },
          ],
        })(
          <Input
            placeholder={formatMessage({
              id: 'form.input.placeholder',
              defaultMessage: 'Please input',
            })}
          />
        )}
      </FormItem>
      <FormItem
        labelCol={{ span: 5 }}
        wrapperCol={{ span: 15 }}
        label={formatMessage({
          id: 'app.operator.user.form.role.label',
          defaultMessage: 'User Role',
        })}
      >
        {form.getFieldDecorator('role', {
          initialValue: method === 'create' ? 'user' : user.role,
        })(
          <Select>
            <Option value="user">
              <FormattedMessage id="app.operator.user.role.user" defaultMessage="User" />
            </Option>
            <Option value="administrator">
              <FormattedMessage
                id="app.operator.user.role.administrator"
                defaultMessage="Administrator"
              />
            </Option>
          </Select>
        )}
      </FormItem>
      <FormItem
        labelCol={{ span: 5 }}
        wrapperCol={{ span: 15 }}
        label={formatMessage({
          id: 'app.operator.user.form.email.label',
          defaultMessage: 'Email',
        })}
      >
        {form.getFieldDecorator('email', {
          initialValue: method === 'create' ? '' : user.email,
          rules: [
            {
              required: true,
              message: formatMessage({
                id: 'app.operator.user.form.email.required',
                defaultMessage: 'Please input email',
              }),
            },
            {
              validator: validateEmail,
            },
          ],
        })(
          <Input
            placeholder={formatMessage({
              id: 'form.input.placeholder',
              defaultMessage: 'Please input',
            })}
          />
        )}
      </FormItem>
      <FormItem
        labelCol={{ span: 5 }}
        wrapperCol={{ span: 15 }}
        label={formatMessage({
          id: 'app.operator.user.form.password.label',
          defaultMessage: 'Password',
        })}
      >
        {form.getFieldDecorator('password', {
          initialValue: method === 'create' ? '' : user.username,
          rules: [
            {
              required: true,
              message: formatMessage({
                id: 'app.operator.user.form.password.required',
                defaultMessage: 'Please input password',
              }),
            },
          ],
        })(
          <Input.Password
            placeholder={formatMessage({
              id: 'form.input.placeholder',
              defaultMessage: 'Please input',
            })}
          />
        )}
      </FormItem>
      <FormItem
        labelCol={{ span: 5 }}
        wrapperCol={{ span: 15 }}
        label={formatMessage({
          id: 'app.operator.user.form.passwordConfirm.label',
          defaultMessage: 'Password Confirm',
        })}
      >
        {form.getFieldDecorator('passwordConfirm', {
          initialValue: method === 'create' ? '' : user.usernamep,
          rules: [
            {
              required: true,
              message: formatMessage({
                id: 'app.operator.user.form.password.required',
                defaultMessage: 'Please input password',
              }),
            },
            {
              validator: validatePasswordConfirm,
            },
          ],
        })(
          <Input.Password
            placeholder={formatMessage({
              id: 'form.input.placeholder',
              defaultMessage: 'Please input',
            })}
          />
        )}
      </FormItem>
      {userRole === 'operator' && (
        <Form.Item
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 15 }}
          label={formatMessage({
            id: 'app.operator.user.form.organization.label',
            defaultMessage: 'Organization',
          })}
        >
          {form.getFieldDecorator('organization', {})(
            <AutoComplete
              onSearch={onSearchOrganization}
              onSelect={onSelectOrganization}
              placeholder={formatMessage({
                id: 'form.input.placeholder',
                defaultMessage: 'Please input',
              })}
            >
              {organizationOptions}
            </AutoComplete>
          )}
        </Form.Item>
      )}
    </Modal>
  );
});

@connect(({ user, organization, loading }) => ({
  user,
  organization,
  loadingUsers: loading.effects['user/fetch'],
  creatingUser: loading.effects['user/createUser'],
}))
class UserManagement extends PureComponent {
  state = {
    modalVisible: false,
    modalMethod: 'create',
    selectedRows: [],
    // formValues: {},
  };

  componentDidMount() {
    const { dispatch } = this.props;

    dispatch({
      type: 'user/fetch',
    });
  }

  handleModalVisible = visible => {
    this.setState({
      modalVisible: !!visible,
    });
  };

  handleSelectRows = rows => {
    this.setState({
      selectedRows: rows,
    });
  };

  createCallback = data => {
    if (data.id) {
      message.success(
        formatMessage(
          {
            id: 'app.operator.user.create.success',
            defaultMessage: 'Create user {name} success',
          },
          {
            name: data.username,
          }
        )
      );
      this.handleModalVisible();
      this.handleFormReset();
    } else {
      message.success(
        formatMessage(
          {
            id: 'app.operator.user.create.fail',
            defaultMessage: 'Create user {name} failed',
          },
          {
            name: data.username,
          }
        )
      );
    }
  };

  deleteCallback = data => {
    const { code, payload } = data;
    const { username } = payload;
    if (code) {
      message.error(
        formatMessage(
          {
            id: 'app.operator.user.delete.fail',
            defaultMessage: 'Delete user {name} failed',
          },
          {
            name: username,
          }
        )
      );
    } else {
      message.success(
        formatMessage(
          {
            id: 'app.operator.user.delete.success',
            defaultMessage: 'Delete user {name} success',
          },
          {
            name: username,
          }
        )
      );
      this.handleFormReset();
    }
  };

  deleteUser = (record, callback = this.deleteCallback) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'user/deleteUser',
      payload: {
        ...record,
      },
      callback,
    });
  };

  handleDelete = record => {
    Modal.confirm({
      title: formatMessage({
        id: 'app.operator.user.form.delete.title',
        defaultMessage: 'Delete User',
      }),
      content: formatMessage(
        {
          id: 'app.operator.user.form.delete.content',
          defaultMessage: 'Confirm to delete user {name}',
        },
        {
          name: record.username,
        }
      ),
      okText: formatMessage({ id: 'form.button.confirm', defaultMessage: 'Confirm' }),
      cancelText: formatMessage({ id: 'form.button.cancel', defaultMessage: 'Cancel' }),
      onOk: () => this.deleteUser(record),
    });
  };

  handleFormReset = () => {
    const { dispatch } = this.props;
    // this.setState({
    //   formValues: {},
    // });
    dispatch({
      type: 'user/fetch',
    });
  };

  handleSubmit = (method, values) => {
    const {
      dispatch,
      user: {
        currentUser: { organization = {} },
      },
    } = this.props;

    // eslint-disable-next-line no-param-reassign
    delete values.passwordConfirm;
    if (userRole === 'administrator' && organization.id) {
      // eslint-disable-next-line no-param-reassign
      values.organization = organization.id;
    }
    switch (method) {
      case 'create':
        dispatch({
          type: 'user/createUser',
          payload: values,
          callback: this.createCallback,
        });
        break;
      default:
        break;
    }
  };

  handleMenuClick = e => {
    const { selectedRows } = this.state;
    let names = [];

    switch (e.key) {
      case 'remove':
        names = selectedRows.map(item => item.username);
        Modal.confirm({
          title: formatMessage({
            id: 'app.operator.user.form.delete.title',
            defaultMessage: 'Delete User',
          }),
          content: formatMessage(
            {
              id: 'app.operator.user.form.delete.content',
              defaultMessage: 'Confirm to delete user {name}',
            },
            {
              name: names.join(', '),
            }
          ),
          okText: formatMessage({ id: 'form.button.confirm', defaultMessage: 'Confirm' }),
          cancelText: formatMessage({ id: 'form.button.cancel', defaultMessage: 'Cancel' }),
          onOk: () => {
            selectedRows.map(user => this.deleteUser(user));
            this.setState({
              selectedRows: [],
            });
            Modal.destroyAll();
          },
        });
        break;
      default:
        break;
    }
  };

  render() {
    const { modalVisible, modalMethod, selectedRows } = this.state;
    const {
      user: { users, pagination, currentUser },
      organization: { organizations },
      loadingUsers,
      creatingUser,
      dispatch,
    } = this.props;
    const data = users.map(user => ({
      ...user,
      disabled: user.username === currentUser.username,
    }));
    const columns = [
      {
        title: (
          <FormattedMessage id="app.operator.user.table.header.name" defaultMessage="User Name" />
        ),
        dataIndex: 'username',
      },
      {
        title: (
          <FormattedMessage id="app.operator.user.table.header.role" defaultMessage="User Role" />
        ),
        dataIndex: 'role',
        render: text => (
          <FormattedMessage id={`app.operator.user.role.${text}`} defaultMessage="User" />
        ),
      },
      {
        title: (
          <FormattedMessage
            id="app.operator.user.table.header.organization"
            defaultMessage="Organization"
          />
        ),
        dataIndex: 'organization',
        render: text => (text ? text.name : ''),
      },
      {
        title: (
          <FormattedMessage
            id="app.operator.organization.table.header.createTime"
            defaultMessage="Create Time"
          />
        ),
        dataIndex: 'created_at',
        render: text => <span>{moment(text).format('YYYY-MM-DD HH:mm:ss')}</span>,
      },
      {
        title: <FormattedMessage id="form.table.header.operation" defaultMessage="Operation" />,
        render: (text, record) => (
          <Fragment>
            <a className={styles.danger} onClick={() => this.handleDelete(record)}>
              <FormattedMessage id="form.menu.item.delete" defaultMessage="Delete" />
            </a>
          </Fragment>
        ),
      },
    ];

    const formProps = {
      visible: modalVisible,
      method: modalMethod,
      handleModalVisible: this.handleModalVisible,
      handleSubmit: this.handleSubmit,
      confirmLoading: creatingUser,
      organizations,
      onSearchOrganization(value) {
        dispatch({
          type: 'organization/listOrganization',
          payload: {
            name: value,
          },
        });
      },
    };
    const menu = (
      <Menu onClick={this.handleMenuClick} selectedKeys={[]}>
        <Menu.Item key="remove">
          <FormattedMessage id="form.menu.item.delete" defaultMessage="Delete" />
        </Menu.Item>
      </Menu>
    );
    return (
      <PageHeaderWrapper
        title={<FormattedMessage id="app.operator.user.title" defaultMessage="User Management" />}
      >
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListOperator}>
              <Button icon="plus" type="primary" onClick={() => this.handleModalVisible(true)}>
                <FormattedMessage id="form.button.new" defaultMessage="New" />
              </Button>
              {selectedRows.length > 0 && (
                <span>
                  <Dropdown overlay={menu}>
                    <Button>
                      <FormattedMessage
                        id="form.button.moreActions"
                        defaultMessage="More Actions"
                      />{' '}
                      <Icon type="down" />
                    </Button>
                  </Dropdown>
                </span>
              )}
            </div>
            <StandardTable
              selectedRows={selectedRows}
              loading={loadingUsers}
              rowKey="id"
              data={{
                list: data,
                pagination,
              }}
              columns={columns}
              onSelectRow={this.handleSelectRows}
              onChange={this.handleTableChange}
            />
          </div>
        </Card>
        <CreateUpdateForm {...formProps} />
      </PageHeaderWrapper>
    );
  }
}

export default UserManagement;
