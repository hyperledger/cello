import React, { PureComponent } from 'react';
import { FormattedMessage, formatMessage } from 'umi-plugin-react/locale';
import { connect } from 'dva';
import { Card, Button, message, List, Badge, Row, Col } from 'antd';
import moment from 'moment';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import router from 'umi/router';
import styles from '../styles.less';

@connect(({ agent, organization, loading }) => ({
  agent,
  organization,
  loadingAgents: loading.effects['agent/listAgent'],
}))
class Agent extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;

    dispatch({
      type: 'agent/listAgent',
    });
    dispatch({
      type: 'organization/listOrganization',
    });
  }

  componentWillUnmount() {
    const { dispatch } = this.props;

    dispatch({
      type: 'agent/clear',
    });
  }

  onAddAgent = () => {
    router.push('/operator/agent/newAgent?action=create');
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

  // TODO: remove these two comment lines after add the functional code
  // eslint-disable-next-line no-unused-vars
  handleDelete = agent => {};

  render() {
    const {
      agent: { agents, pagination },
      organization: { organizations },
      loadingAgents,
    } = this.props;

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
                id="app.operator.agent.table.header.createTime"
                defaultMessage="Create Time"
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
      </PageHeaderWrapper>
    );
  }
}

export default Agent;
