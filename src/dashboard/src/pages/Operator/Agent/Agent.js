import React, { PureComponent } from 'react';
import { FormattedMessage, formatMessage } from 'umi-plugin-react/locale';
import { connect } from 'dva';
import {
  Card,
  Button,
  message,
  List,
  Badge,
  Row,
  Col,
  Modal,
  Form,
  InputNumber,
  Select,
} from 'antd';
import moment from 'moment';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import router from 'umi/router';
import styles from '../styles.less';
import { getAuthority } from '@/utils/authority';

const FormItem = Form.Item;
const { Option } = Select;

const ApplyAgentForm = Form.create()(props => {
  const { visible, form, handleSubmit, handleModalVisible, confirmLoading } = props;
  const onSubmit = () => {
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      handleSubmit(fieldsValue);
    });
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
      destroyOnClose
      title={
        <FormattedMessage id="app.operator.applyAgent.title" defaultMessage="Apply for agent" />
      }
      visible={visible}
      confirmLoading={confirmLoading}
      width="30%"
      onOk={onSubmit}
      onCancel={() => handleModalVisible()}
    >
      <FormItem
        {...formItemLayout}
        label={formatMessage({
          id: 'app.operator.newAgent.label.agentCapacity',
          defaultMessage: 'Capacity of agent',
        })}
      >
        {form.getFieldDecorator('capacity', {
          initialValue: '',
          rules: [
            {
              required: true,
              message: (
                <FormattedMessage
                  id="app.operator.newAgent.required.agentCapacity"
                  defaultMessage="Please input the capacity of the agent."
                />
              ),
            },
          ],
        })(
          <InputNumber
            placeholder={formatMessage({
              id: 'app.operator.newAgent.label.agentCapacity',
              defaultMessage: 'Capacity of agent',
            })}
            min={1}
            max={100}
            style={width}
          />
        )}
      </FormItem>
      <FormItem
        {...formItemLayout}
        label={formatMessage({
          id: 'app.operator.newAgent.label.type',
          defaultMessage: 'Type',
        })}
      >
        {form.getFieldDecorator('type', {
          initialValue: agentTypeValues[0],
          rules: [
            {
              required: true,
              message: (
                <FormattedMessage
                  id="app.operator.newAgent.required.type"
                  defaultMessage="Please select a type."
                />
              ),
            },
          ],
        })(<Select style={width}>{agentTypeOptions}</Select>)}
      </FormItem>
    </Modal>
  );
});

@connect(({ agent, organization, loading }) => ({
  agent,
  organization,
  loadingAgents: loading.effects['agent/listAgent'],
  applyingAgent: loading.effects['agent/applyAgent'],
}))
class Agent extends PureComponent {
  state = {
    modalVisible: false,
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

    dispatch({
      type: 'agent/listAgent',
      payload: {
        per_page: pagination.pageSize,
        page: pagination.current,
      },
    });
    dispatch({
      type: 'organization/listOrganization',
    });
  };

  applyCallback = () => {
    message.success(
      formatMessage({
        id: 'app.operator.applyAgent.success',
        defaultMessage: 'Successful application for agent.',
      })
    );
    this.queryAgentList();
    this.handleModalVisible();
  };

  handleModalVisible = visible => {
    this.setState({
      modalVisible: !!visible,
    });
  };

  handleSubmit = values => {
    const { dispatch } = this.props;
    dispatch({
      type: 'agent/applyAgent',
      payload: values,
      callback: this.applyCallback,
    });
  };

  onAddAgent = () => {
    const userRole = getAuthority()[0];
    if (userRole === 'operator') {
      router.push('/operator/agent/newAgent?action=create');
    } else {
      this.handleModalVisible(true);
    }
  };

  deleteCallback = () => {
    const userRole = getAuthority()[0];
    const id =
      userRole === 'operator'
        ? 'app.operator.agent.delete.success'
        : 'app.operator.agent.release.success';
    const defaultMessage =
      userRole === 'operator' ? 'Delete agent success.' : 'Release agent success.';

    message.success(
      formatMessage({
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
    router.push(`/operator/agent/editAgent?action=edit&id=${agent.id}`);
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
        type: 'agent/releaseAgent',
        payload: agent.id,
        callback: this.deleteCallback,
      });
    }
  };

  handleDelete = agent => {
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
      title: formatMessage({
        id: titleMessageId,
        defaultMessage: titleDefaultMessage,
      }),
      content: formatMessage(
        {
          id: contentMessageId,
          defaultMessage: contentDefaultMessage,
        },
        {
          name: agent.name,
        }
      ),
      okText: formatMessage({ id: 'form.button.confirm', defaultMessage: 'Confirm' }),
      cancelText: formatMessage({ id: 'form.button.cancel', defaultMessage: 'Cancel' }),
      onOk: () => this.deleteAgent(agent),
    });
  };

  render() {
    const {
      agent: { agents, pagination },
      organization: { organizations },
      loadingAgents,
      applyingAgent,
    } = this.props;

    const { modalVisible } = this.state;

    const filterOrgName = organizationId => {
      const orgs = organizations.filter(organization => organizationId === organization.id);
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
            <p>
              <FormattedMessage id="app.operator.agent.type" defaultMessage="Type" />
            </p>
            <p>{type}</p>
          </Col>
          <Col span={10}>
            <p>
              <FormattedMessage
                id="app.operator.agent.table.header.creationTime"
                defaultMessage="Creation Time"
              />
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
    };

    return (
      <PageHeaderWrapper
        title={<FormattedMessage id="app.operator.agent.title" defaultMessage="Agent Management" />}
      >
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListOperator}>
              <Button
                className={styles.newAgentButton}
                icon="plus"
                type="dashed"
                onClick={() => this.onAddAgent()}
              >
                <FormattedMessage id="form.button.new" defaultMessage="New" />
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
                      <FormattedMessage id="form.menu.item.update" defaultMessage="Update" />
                    </a>,
                    <a onClick={() => this.nodeList(item)}>
                      <FormattedMessage id="menu.operator.node" defaultMessage="Node" />
                    </a>,
                    <a onClick={() => this.handleDelete(item)}>
                      <FormattedMessage id="form.menu.item.delete" defaultMessage="Delete" />
                    </a>,
                  ]}
                >
                  <List.Item.Meta
                    title={<span className={styles.ListItemTitle}>{item.name}</span>}
                    description={
                      <div>
                        <p>{item.ip}</p>
                        <p>
                          <FormattedMessage
                            id="app.operator.agent.listItem.organization"
                            defaultMessage="Organization"
                          />
                          {' : '}
                          {filterOrgName(item.organization_id)}
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

export default Agent;
