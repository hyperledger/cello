import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import { FormattedMessage, formatMessage } from 'umi-plugin-react/locale';
import { Card, Button, Form, Modal, Input, message, Divider } from 'antd';
import moment from 'moment';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import StandardTable from '@/components/StandardTable';
import styles from './Organization.less';

const FormItem = Form.Item;

const CreateUpdateForm = Form.create()(props => {
  const {
    visible,
    form,
    method,
    handleSubmit,
    handleModalVisible,
    confirmLoading,
    organization,
  } = props;
  const onSubmit = () => {
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      handleSubmit(method, fieldsValue, organization);
    });
  };

  return (
    <Modal
      destroyOnClose
      title={
        <FormattedMessage
          id={`app.operator.organization.form.${method === 'create' ? 'new' : 'update'}.title`}
          defaultMessage="New Organization"
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
          id: 'app.operator.organization.form.name.label',
          defaultMessage: 'Organization Name',
        })}
      >
        {form.getFieldDecorator('name', {
          initialValue: method === 'create' ? '' : organization.name,
          rules: [
            {
              required: true,
              message: formatMessage({
                id: 'app.operator.organization.form.name.required',
                defaultMessage: 'Please input organization name',
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
    </Modal>
  );
});

@connect(({ organization, loading }) => ({
  organization,
  loadingOrganizations: loading.effects['organization/listOrganization'],
  creatingOrganization: loading.effects['organization/createOrganization'],
}))
class Organization extends PureComponent {
  state = {
    modalVisible: false,
    modalMethod: 'create',
    selectedRows: [],
    formValues: {},
    currentOrganization: {},
  };

  componentDidMount() {
    const { dispatch } = this.props;

    dispatch({
      type: 'organization/listOrganization',
    });
  }

  componentWillUnmount() {
    const { dispatch } = this.props;

    dispatch({
      type: 'organization/clear',
    });
  }

  handleModalVisible = visible => {
    if (!visible) {
      this.setState({
        modalMethod: 'create',
        currentOrganization: {},
      });
    }
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
    const { name } = data.payload;
    if (data.id) {
      message.success(
        formatMessage(
          {
            id: 'app.operator.organization.create.success',
            defaultMessage: 'Create organization {name} success',
          },
          {
            name,
            id: data.id,
          }
        )
      );
      this.handleModalVisible();
      this.handleFormReset();
    } else {
      message.error(
        formatMessage(
          {
            id: 'app.operator.organization.create.fail',
            defaultMessage: 'Create organization {name} failed',
          },
          {
            name,
          }
        )
      );
    }
  };

  updateCallback = data => {
    const { code, payload } = data;
    const { name } = payload;
    if (code) {
      message.error(
        formatMessage(
          {
            id: 'app.operator.organization.update.fail',
            defaultMessage: 'Update organization {name} failed',
          },
          {
            name,
          }
        )
      );
    } else {
      message.error(
        formatMessage(
          {
            id: 'app.operator.organization.update.success',
            defaultMessage: 'Update organization {name} success',
          },
          {
            name,
          }
        )
      );
      this.handleModalVisible();
      this.handleFormReset();
    }
  };

  deleteCallback = data => {
    const { code, payload } = data;
    const { name } = payload;
    if (code) {
      message.error(
        formatMessage(
          {
            id: 'app.operator.organization.delete.fail',
            defaultMessage: 'Delete organization {name} failed',
          },
          {
            name,
          }
        )
      );
    } else {
      message.success(
        formatMessage(
          {
            id: 'app.operator.organization.delete.success',
            defaultMessage: 'Delete organization {name} success',
          },
          {
            name,
          }
        )
      );
      this.handleFormReset();
    }
  };

  handleSubmit = (method, values, record) => {
    const { dispatch } = this.props;
    switch (method) {
      case 'create':
        dispatch({
          type: 'organization/createOrganization',
          payload: values,
          callback: this.createCallback,
        });
        break;
      case 'update':
        dispatch({
          type: 'organization/updateOrganization',
          payload: {
            ...values,
            id: record.id,
          },
          callback: this.updateCallback,
        });
        break;
      default:
        break;
    }
  };

  handleFormReset = () => {
    const { dispatch } = this.props;
    this.setState({
      formValues: {},
    });
    dispatch({
      type: 'organization/listOrganization',
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
      type: 'organization/listOrganization',
      payload: params,
    });
  };

  deleteOrganization = (record, callback = this.deleteCallback) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'organization/deleteOrganization',
      payload: {
        ...record,
      },
      callback,
    });
  };

  showUpdate = record => {
    const { handleModalVisible } = this;
    this.setState(
      {
        currentOrganization: record,
        modalMethod: 'update',
      },
      () => {
        handleModalVisible(true);
      }
    );
  };

  handleDelete = record => {
    Modal.confirm({
      title: formatMessage({
        id: 'app.operator.organization.form.delete.title',
        defaultMessage: 'Delete Organization',
      }),
      content: formatMessage(
        {
          id: 'app.operator.organization.form.delete.content',
          defaultMessage: 'Confirm to delete organization {name}',
        },
        {
          name: record.name,
        }
      ),
      okText: formatMessage({ id: 'form.button.confirm', defaultMessage: 'Confirm' }),
      cancelText: formatMessage({ id: 'form.button.cancel', defaultMessage: 'Cancel' }),
      onOk: () => this.deleteOrganization(record),
    });
  };

  render() {
    const { selectedRows, modalVisible, modalMethod, currentOrganization } = this.state;
    const {
      organization: { organizations, pagination },
      loadingOrganizations,
      creatingOrganization,
    } = this.props;
    const columns = [
      {
        title: (
          <FormattedMessage
            id="app.operator.organization.table.header.name"
            defaultMessage="Organization Name"
          />
        ),
        dataIndex: 'name',
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
            <a onClick={() => this.showUpdate(record)}>
              <FormattedMessage id="form.menu.item.update" defaultMessage="Update" />
            </a>
            <Divider type="vertical" />
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
      organization: currentOrganization,
      handleSubmit: this.handleSubmit,
      handleModalVisible: this.handleModalVisible,
      confirmLoading: creatingOrganization,
    };
    return (
      <PageHeaderWrapper
        title={
          <FormattedMessage
            id="app.operator.organization.title"
            defaultMessage="Organization Management"
          />
        }
      >
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListOperator}>
              <Button icon="plus" type="primary" onClick={() => this.handleModalVisible(true)}>
                <FormattedMessage id="form.button.new" defaultMessage="New" />
              </Button>
            </div>
            <StandardTable
              selectedRows={selectedRows}
              loading={loadingOrganizations}
              rowKey="id"
              data={{
                list: organizations,
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

export default Organization;
