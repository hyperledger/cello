/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent, Fragment } from 'react';
import { connect, injectIntl, history } from 'umi';
import { Card, Button, Modal, message, Divider, Input, Select, Form, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import StandardTable from '@/components/StandardTable';
import styles from './styles.less';
import { useIntl } from "umi";

const FormItem = Form.Item;
const { Option } = Select;

const CreateChannel = props => {
  const [form] = Form.useForm();
  const intl = useIntl();
  const { modalVisible, handleCreate, handleModalVisible, nodes, creating, fetchChannels } = props;

  const createCallback = response => {
    if (response.status !== 'successful') {
      message.error(intl.formatMessage({
        id: 'app.operator.channel.form.create.fail',
        defaultMessage: 'Create channel failed',
      }));
    }
    else {
      message.success(intl.formatMessage({
        id: 'app.operator.channel.form.create.success',
        defaultMessage: 'Create channel succeed',
      }));
      form.resetFields();
      handleModalVisible();
      fetchChannels();
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

  const peers = [];
  const orderers = [];

  Object.keys(nodes).forEach(item => {
    if (nodes[item].type === 'peer') {
      peers.push({label: nodes[item].name, value: nodes[item].id});
    }
    else {
      orderers.push({label: nodes[item].name, value: nodes[item].id});
    }
  });

  const tagRender = (props) => {
    const { label, closable, onClose } = props;
    const onPreventMouseDown = event => {
      event.preventDefault();
      event.stopPropagation();
    };
    return (
      <Tag
        color={'cyan'}
        onMouseDown={onPreventMouseDown}
        closable={closable}
        onClose={onClose}
        style={{ marginRight: 3 }}
      >
        {label}
      </Tag>
    );
  };

  return(
    <Modal
      destroyOnClose
      title={intl.formatMessage({
        id: 'app.operator.channel.form.create.header.title',
        defaultMessage: 'Create Channel',
      })}
      confirmLoading={ creating }
      visible={ modalVisible }
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
            id: 'app.operator.channel.form.create.name',
            defaultMessage: 'Name',
          })}
          name="name"
          initialValue=''
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'app.operator.channel.form.create.checkName',
                defaultMessage: 'Please enter the channel name',
              }),
            },
          ]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'app.operator.channel.form.create.name',
              defaultMessage: 'Name',
            })}
          />
        </FormItem>
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.channel.form.create.orderer',
            defaultMessage: 'Please select orderer',
          })}
          name="orderers"
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'app.operator.channel.form.create.checkOrderer',
                defaultMessage: 'Please select orderer',
              }),
            },
          ]}
        >
          <Select
            mode={"multiple"}
            options={orderers}
            tagRender={tagRender}
            dropdownClassName={styles.dropdownClassName}
          />
        </FormItem>
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.channel.form.create.peer',
            defaultMessage: 'Peer',
          })}
          name="peers"
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'app.operator.channel.form.create.checkPeer',
                defaultMessage: 'Please select peer',
              }),
            },
          ]}
        >
          <Select
            mode={"multiple"}
            options={peers}
            tagRender={tagRender}
            dropdownClassName={styles.dropdownClassName}
          />
        </FormItem>
      </Form>
    </Modal>
  );
};

@connect(({ channel, node, loading }) => ({
  channel,
  node,
  loadingChannels: loading.effects['channel/listChannel'],
  creating: loading.effects['channel/createChannel']
}))
class Channel extends PureComponent {
  state = {
    selectedRows: [],
    formValues: {},
    modalVisible: false
  };

  componentDidMount() {
    this.fetchChannels();
  }

  componentWillUnmount() {
    const { dispatch } = this.props;

    dispatch({
      type: 'channel/clear',
    });
  }

  fetchChannels = () => {
    const { dispatch } = this.props;

    dispatch({
      type: 'channel/listChannel',
    });

    dispatch({
      type: 'node/listNode',
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
      type: 'channel/listChannel',
      payload: params,
    });
  };

  handleModalVisible = visible => {
    this.setState({
      modalVisible: !!visible
    });
  };

  onCreateChannel = () => {
    this.handleModalVisible(true);
  };

  handleCreate = ( values, callback ) => {
    const { dispatch } = this.props;

    dispatch({
      type: 'channel/createChannel',
      payload: values,
      callback
    });
  };

  render() {
    const { selectedRows, modalVisible } = this.state;
    const {
      channel: { channels, pagination },
      node: { nodes },
      loadingChannels,
      intl,
      creating
    } = this.props;

    const formProps = {
      modalVisible,
      handleCreate: this.handleCreate,
      handleModalVisible: this.handleModalVisible,
      fetchChannels: this.fetchChannels,
      creating,
      intl,
      nodes
    };

    const columns = [
      {
        title: intl.formatMessage({
          id: 'app.operator.channel.table.header.name',
          defaultMessage: 'Channel Name',
        }),
        dataIndex: 'name',
      },
      {
        title: intl.formatMessage({
          id: 'app.operator.channel.table.header.network',
          defaultMessage: 'Network',
        }),
        render: (text, record) => (record.network.name),
      },
      {
        title: intl.formatMessage({
          id: 'form.table.header.operation',
          defaultMessage: 'Operation',
        }),
        render: (text, record) => (
          <Fragment>
            <a>
              {intl.formatMessage({ id: 'form.menu.item.update', defaultMessage: 'Update' })}
            </a>
            <Divider type="vertical" />
            <a className={styles.danger}>
              {intl.formatMessage({ id: 'form.menu.item.delete', defaultMessage: 'Delete' })}
            </a>
          </Fragment>
        ),
      },
    ];
    return (
      <PageHeaderWrapper
        title={intl.formatMessage({
          id: 'app.operator.channel.title',
          defaultMessage: 'Channel Management',
        })}
      >
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListOperator}>
              <Button type="primary" onClick={this.onCreateChannel}>
                <PlusOutlined />
                {intl.formatMessage({ id: 'form.button.new', defaultMessage: 'New' })}
              </Button>
            </div>
            <StandardTable
              selectedRows={selectedRows}
              loading={loadingChannels}
              rowKey="id"
              data={{
                list: channels,
                pagination,
              }}
              columns={columns}
              onSelectRow={this.handleSelectRows}
              onChange={this.handleTableChange}
            />
          </div>
        </Card>
        <CreateChannel {...formProps} />
      </PageHeaderWrapper>
    );
  }
}

export default injectIntl(Channel);
