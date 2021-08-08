import React, { PureComponent } from 'react';
import { connect, history, useIntl, injectIntl } from 'umi';
import { Card, Button, message, List, Badge, Row, Col, Modal, Form, Select, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import moment from 'moment';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import { getAuthority } from '@/utils/authority';
import styles from '../styles.less';

const FormItem = Form.Item;
const { Option } = Select;

const ApplyAgentForm = props => {
  const [form] = Form.useForm();
  const { visible, handleSubmit, handleModalVisible, confirmLoading, action, agentData } = props;
  const intl = useIntl();
  const onSubmit = () => {
    form.submit();
  };
  const onFinish = values => {
    if (action === 'update') {
      handleSubmit({name: values.name, id: agentData.id}, action);
    }
    else {
      handleSubmit(values, action);
    }
  };
  const agentTypeValues = ['docker', 'kubernetes'];
  const agentTypeOptions = agentTypeValues.map(item => (
    <Option value={item} key={item}>
      <span>{item}</span>
    </Option>
  ));
  const width = { width: '120px' };
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
      destroyOnClose={true}
      title={intl.formatMessage({
        id: 'app.operator.applyAgent.title',
        defaultMessage: 'Apply for agent',
      })}
      visible={visible}
      confirmLoading={confirmLoading}
      width="45%"
      onOk={onSubmit}
      onCancel={() => handleModalVisible(false)}
    >
      <Form
        onFinish={onFinish}
        form={form}
        preserve={false}
      >
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.newAgent.label.name',
            defaultMessage: 'Name',
          })}
          name="name"
          initialValue={action === 'create' ? '' : agentData.name}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'app.operator.newAgent.required.Name',
                defaultMessage: 'Please input name.',
              }),
            },
          ]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'app.operator.newAgent.label.name',
              defaultMessage: 'Name',
            })}
          />
        </FormItem>
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.newAgent.label.ip',
            defaultMessage: 'Agent IP Address',
          })}
          name="urls"
          initialValue={action === 'create' ? '' : agentData.urls}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'app.operator.newAgent.required.ip',
                defaultMessage: 'Please input the ip address & port of the agent.',
              }),
            },
          ]}
        >
          <Input placeholder="http://192.168.0.10:5001" disabled={action==='update'} />
        </FormItem>
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.newAgent.label.type',
            defaultMessage: 'Type',
          })}
          name="type"
          initialValue={action === 'create' ? agentTypeValues[0] : agentData.type}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'app.operator.newAgent.required.type',
                defaultMessage: 'Please select a type.',
              }),
            },
          ]}
        >
          <Select style={width} disabled={action==='update'}>{agentTypeOptions}</Select>
        </FormItem>
      </Form>
    </Modal>
  );
};

@connect(({ agent, organization, user, loading }) => ({
  agent,
  organization,
  user,
  loadingAgents: loading.effects['agent/listAgent'],
  applyingAgent: loading.effects['agent/applyAgent'],
}))
class Agent extends PureComponent {
  state = {
    modalVisible: false,
    action: 'create',
    agentData: {}
  };

  componentDidMount() {
    this.queryAgentList();
  }

  componentWillUnmount() {
    const { dispatch } = this.props;

    dispatch({
      type: 'agent/clear',
    });
  }

  queryAgentList = () => {
    const {
      dispatch,
      agent: { pagination },
    } = this.props;
    const userRole = getAuthority()[0];

    dispatch({
      type: 'agent/listAgent',
      payload: {
        per_page: pagination.pageSize,
        page: pagination.current,
      },
    });
    if (userRole === 'operator') {
      dispatch({
        type: 'organization/listOrganization',
      });
    }
  };

  submitCallback = (response) => {
    if (response.status === 'successful') {
      const { intl } = this.props;
      if (response.action === 'create') {
        message.success(
          intl.formatMessage({
            id: 'app.operator.applyAgent.success',
            defaultMessage: 'Successful application for agent.',
          })
        );
      }
      else {
        message.success(
          intl.formatMessage({
            id: 'app.operator.updateAgent.success',
            defaultMessage: 'Successful application for agent.',
          })
        );
      }
      this.queryAgentList();
      this.handleModalVisible();
    }
  };

  handleModalVisible = (visible, action, data) => {
    this.setState({
      modalVisible: !!visible,
      action: action || 'create',
      agentData: data || {}
    });
  };

  handleSubmit = (values, action) => {
    const { dispatch } = this.props;
    if (action === 'create') {
      dispatch({
        type: 'agent/applyAgent',
        payload: {data: values, action},
        callback: this.submitCallback,
      });
    }
    else {
      dispatch({
        type: 'agent/updateAgent',
        payload: {data: values, action},
        callback: this.submitCallback,
      });
    }
  };

  onAddAgent = () => {
    this.handleModalVisible(true);
  };

  deleteCallback = () => {
    const { intl } = this.props;
    const userRole = getAuthority()[0];
    const id =
      userRole === 'operator'
        ? 'app.operator.agent.delete.success'
        : 'app.operator.agent.release.success';
    const defaultMessage =
      userRole === 'operator' ? 'Delete agent success.' : 'Release agent success.';

    message.success(
      intl.formatMessage({
        id,
        defaultMessage,
      })
    );
    this.queryAgentList();
  };

  handleTableChange = page => {
    const {
      dispatch,
      agent: { pagination },
    } = this.props;
    const params = {
      page,
      per_page: pagination.pageSize,
    };
    dispatch({
      type: 'agent/listAgent',
      payload: params,
    });
  };

  editAgent = agent => {
    this.handleModalVisible(true, 'update', agent);
  };

  // TODO: remove these two comment lines after add the functional code
  // eslint-disable-next-line no-unused-vars
  nodeList = agent => {};

  deleteAgent = agent => {
    const { dispatch } = this.props;
    const userRole = getAuthority()[0];

    if (userRole === 'operator') {
      dispatch({
        type: 'agent/deleteAgent',
        payload: agent.id,
        callback: this.deleteCallback,
      });
    } else {
      dispatch({
        type: 'agent/deleteAgent',
        payload: agent.id,
        callback: this.deleteCallback,
      });
    }
  };

  handleDelete = agent => {
    const { intl } = this.props;
    const userRole = getAuthority()[0];
    const titleMessageId =
      userRole === 'operator'
        ? 'app.operator.agent.form.delete.title'
        : 'app.operator.agent.form.release.title';
    const titleDefaultMessage = userRole === 'operator' ? 'Delete Agent' : 'Release Agent';
    const contentMessageId =
      userRole === 'operator'
        ? 'app.operator.agent.form.delete.content'
        : 'app.operator.agent.form.release.content';
    const contentDefaultMessage =
      userRole === 'operator'
        ? 'Confirm to delete the agent {name}?'
        : 'Confirm to release the agent {name}?';

    Modal.confirm({
      title: intl.formatMessage({
        id: titleMessageId,
        defaultMessage: titleDefaultMessage,
      }),
      content: intl.formatMessage(
        {
          id: contentMessageId,
          defaultMessage: contentDefaultMessage,
        },
        {
          name: agent.name,
        }
      ),
      okText: intl.formatMessage({ id: 'form.button.confirm', defaultMessage: 'Confirm' }),
      cancelText: intl.formatMessage({ id: 'form.button.cancel', defaultMessage: 'Cancel' }),
      onOk: () => this.deleteAgent(agent),
    });
  };

  render() {
    const {
      agent: { agents, pagination },
      organization: { organizations },
      loadingAgents,
      applyingAgent,
      user: {
        currentUser: { organization = {} },
      },
      intl,
    } = this.props;

    const { modalVisible, action, agentData } = this.state;
    const userRole = getAuthority()[0];

    const filterOrgName = organizationId => {
      const orgs = organizations.filter(org => organizationId === org.id);
      if (orgs.length > 0) {
        return orgs[0].name;
      }
      return '';
    };

    function badgeStatus(status) {
      let statusOfBadge = 'default';
      switch (status) {
        case 'active':
          statusOfBadge = 'success';
          break;
        case 'inactive':
          statusOfBadge = 'error';
          break;
        default:
          break;
      }

      return statusOfBadge;
    }

    const paginationProps = {
      showQuickJumper: true,
      total: pagination.total,
      pageSize: pagination.pageSize,
      currentPage: pagination.current,
      onChange: this.handleTableChange,
    };

    const ListContent = ({ data: { type, created_at: createdAt, status } }) => (
      <div>
        <Row gutter={15} className={styles.ListContentRow}>
          <Col span={8}>
            <p>{intl.formatMessage({ id: 'app.operator.agent.type', defaultMessage: 'Type' })}</p>
            <p>{type}</p>
          </Col>
          <Col span={10}>
            <p>
              {intl.formatMessage({
                id: 'app.operator.agent.table.header.creationTime',
                defaultMessage: 'Creation Time',
              })}
            </p>
            <p>{moment(createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
          </Col>
          <Col span={6}>
            <Badge status={badgeStatus(status)} text={status} />
          </Col>
        </Row>
      </div>
    );

    const formProps = {
      visible: modalVisible,
      handleSubmit: this.handleSubmit,
      handleModalVisible: this.handleModalVisible,
      confirmLoading: applyingAgent,
      action,
      agentData
    };

    return (
      <PageHeaderWrapper
        title={intl.formatMessage({
          id: 'app.operator.agent.title',
          defaultMessage: 'Agent Management',
        })}
      >
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListOperator}>
              <Button
                className={styles.newAgentButton}
                type="dashed"
                onClick={() => this.onAddAgent()}
              >
                <PlusOutlined />{' '}
                {intl.formatMessage({ id: 'form.button.new', defaultMessage: 'New' })}
              </Button>
            </div>
            <List
              size="large"
              rowKey="id"
              loading={loadingAgents}
              pagination={agents.length > 0 ? paginationProps : false}
              dataSource={agents}
              renderItem={item => (
                <List.Item
                  actions={[
                    <a onClick={() => this.editAgent(item)}>
                      {intl.formatMessage({
                        id: 'form.menu.item.update',
                        defaultMessage: 'Update',
                      })}
                    </a>,
                    <a onClick={() => this.nodeList(item)}>
                      {intl.formatMessage({ id: 'menu.operator.node', defaultMessage: 'Node' })}
                    </a>,
                    <a onClick={() => this.handleDelete(item)}>
                      {intl.formatMessage({
                        id: 'form.menu.item.delete',
                        defaultMessage: 'Delete',
                      })}
                    </a>,
                  ]}
                >
                  <List.Item.Meta
                    title={<span className={styles.ListItemTitle}>{item.name}</span>}
                    description={
                      <div>
                        <p>{item.ip}</p>
                        <p>
                          {intl.formatMessage({
                            id: 'app.operator.agent.listItem.organization',
                            defaultMessage: 'Organization',
                          })}
                          {' : '}
                          {userRole === 'operator'
                            ? filterOrgName(item.organization_id)
                            : organization.name || ''}
                        </p>
                      </div>
                    }
                  />
                  <ListContent data={item} />
                </List.Item>
              )}
            />
          </div>
        </Card>
        <ApplyAgentForm {...formProps} />
      </PageHeaderWrapper>
    );
  }
}

export default injectIntl(Agent);
