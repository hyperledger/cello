import React, { PureComponent } from 'react';
import { FormattedMessage, formatMessage } from 'umi-plugin-react/locale';
import { connect } from 'dva';
import { Card, Button, Modal, message, List, Badge, Row, Col } from 'antd';
import moment from 'moment';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import styles from '../styles.less';
import { routerRedux } from 'dva/router';
import { stringify } from 'qs';

@connect(({agent, organization, loading}) => ({
  agent,
  organization,
  loadingAgents: loading.effects['agent/listAgent'],
}))

class Agent extends PureComponent {
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

  handleTableChange = (page) => {
    const { dispatch, agent: { pagination } } = this.props;
    const params = {
      page: page,
      per_page: pagination.pageSize,
    };
    dispatch({
      type: 'agent/listAgent',
      payload: params,
    });
  };

  editAgent = agent => {

  };

  nodeList = agent => {

  };

  handleDelete = agent => {

  };

  render() {
    const {
      agent: { agents, pagination },
      organization: { organizations },
      loadingAgents
    } = this.props;

    const filterOrgName = (organizationId) => {
      const orgs = organizations.filter(organization => organizationId === organization.id);
      if (orgs.length > 0) {
        return orgs[0].name;
      }
      else
        return '';
    };

    function badgeStatus(status) {
      switch (status) {
        case 'active':
          return 'success';
        case 'inactive':
          return 'error';
        default:
          break;
      }
    }

    const paginationProps = {
      showQuickJumper: true,
      total: pagination.total,
      pageSize: pagination.pageSize,
      currentPage: pagination.current,
      onChange: this.handleTableChange
    };

    const ListContent = ({ data: { type, created_at, status } }) => (
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
              <FormattedMessage id="app.operator.agent.table.header.createTime" defaultMessage="Create Time" />
            </p>
            <p>{moment(created_at).format('YYYY-MM-DD HH:mm:ss')}</p>
          </Col>
          <Col span={6}>
            <Badge status={badgeStatus(status)} text={status} />
          </Col>
        </Row>
      </div>
    );

    return (
      <PageHeaderWrapper
        title={
          <FormattedMessage
            id="app.operator.agent.title"
            defaultMessage="Agent Management"
          />
        }
      >
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListOperator}>
              <Button className={styles.newAgentButton} icon="plus" type="dashed" onClick={() => this.onAddAgent()}>
                <FormattedMessage id="form.button.new" defaultMessage="New" />
              </Button>
            </div>
            <List
              size={'large'}
              rowKey={'id'}
              loading={loadingAgents}
              pagination={paginationProps}
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
                    </a>
                  ]}
                >
                  <List.Item.Meta
                    title={<span className={styles.ListItemTitle}>{item.name}</span>}
                    description={
                      <div>
                        <p>{item.worker_api}</p>
                        <p>
                          <FormattedMessage id="app.operator.agent.listItem.organization" defaultMessage="Organization" />{' : '}
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
