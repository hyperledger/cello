/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { List, Card, Button, Dropdown, Menu, Icon, Badge, Modal } from 'antd';
import { stringify } from 'qs';
import moment from 'moment'
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './style.less';

const messages = defineMessages({
  button: {
    add: {
      id: 'Host.Button.Add',
      defaultMessage: 'Add',
    },
    delete: {
      id: 'Host.Button.Delete',
      defaultMessage: 'Delete',
    },
    fillUp: {
      id: 'Host.Button.FillUp',
      defaultMessage: 'Fill Up',
    },
    clean: {
      id: 'Host.Button.Clean',
      defaultMessage: 'Clean',
    },
    reset: {
      id: 'Host.Button.Reset',
      defaultMessage: 'Reset',
    },
    edit: {
      id: 'Host.Button.Edit',
      defaultMessge: 'Edit',
    },
    more: {
      id: 'Host.Button.More',
      defaultMessage: 'More',
    },
  },
  label: {
    type: {
      id: 'Host.Label.Type',
      defaultMessage: 'Type',
    },
    createTime: {
      id: 'Host.Label.CreateTime',
      defaultMessage: 'Create Time',
    },
    capacity: {
      id: 'Host.Label.Capacity',
      defaultMessage: 'Capacity',
    },
    runningChains: {
      id: 'Host.Label.RunningChains',
      defaultMessage: 'Running Chains',
    },
  },
  title: {
    hostList: {
      id: 'Host.Title.HostList',
      defaultMessage: 'Host List',
    },
  },
  message: {
    confirm: {
      deleteHost: {
        id: 'Host.Message.Confirm.DeleteHost',
        defaultMessage: 'Do you want to delete host {name}?',
      },
    },
  },
});

@connect(({ host, loading }) => ({
  host,
  loadingHosts: loading.effects['host/fetchHosts'],
}))
class Host extends PureComponent {
  componentDidMount() {
    this.props.dispatch({
      type: 'host/fetchHosts',
    });
  }
  onClickAddHost = () => {
    this.props.dispatch(
      routerRedux.push({
        pathname: '/host/create',
      })
    );
  };
  clickMore = ({ item, key }) => {
    const { dispatch, intl } = this.props;
    const { id, name } = item.props.host;
    const values = { name };
    switch (key) {
      case 'delete':
        Modal.confirm({
          title: intl.formatMessage(messages.message.confirm.deleteHost, values),
          onOk() {
            dispatch({
              type: 'host/deleteHost',
              payload: {
                id,
              },
            });
          },
        });
        break;
      case 'fillup':
      case 'clean':
      case 'reset':
        dispatch({
          type: 'host/operateHost',
          payload: {
            id,
            action: key,
            name,
          },
        });
        break;
      default:
        break;
    }
  };
  editHost = host => {
    this.props.dispatch(
      routerRedux.push({
        pathname: '/host/create',
        search: stringify({
          id: host.id,
          action: 'update',
        }),
      })
    );
  };
  render() {
    const { host, loadingHosts, intl } = this.props;
    const { hosts } = host;
    const paginationProps = {
      showSizeChanger: true,
      showQuickJumper: true,
      pageSize: 5,
      total: hosts.length,
    };
    function badgeStatus(status) {
      switch (status) {
        case 'active':
          return 'success';
        case 'error':
          return 'error';
        case 'stopped':
          return 'default';
        default:
          break;
      }
    }
    const ListContent = ({ data: { type, create_ts, status } }) => (
      <div className={styles.listContent}>
        <div className={styles.listContentItem}>
          <span>
            <FormattedMessage {...messages.label.type} />
          </span>
          <p>{type}</p>
        </div>
        <div className={styles.listContentItem}>
          <span>
            <FormattedMessage {...messages.label.createTime} />
          </span>
          <p>{moment.unix(create_ts).format("YYYY/MM/DD H:mm:ss")}</p>
        </div>
        <div className={styles.listContentItem}>
          <Badge className={styles['status-badge']} status={badgeStatus(status)} text={status} />
        </div>
      </div>
    );
    const menu = hostItem => (
      <Menu onClick={this.clickMore}>
        <Menu.Item
          key="fillup"
          disabled={hostItem.clusters.length === hostItem.capacity}
          host={hostItem}
        >
          <FormattedMessage {...messages.button.fillUp} />
        </Menu.Item>
        <Menu.Item key="clean" disabled={hostItem.clusters.length === 0} host={hostItem}>
          <FormattedMessage {...messages.button.clean} />
        </Menu.Item>
        <Menu.Item key="reset" disabled={hostItem.clusters.length === 0} host={hostItem}>
          <FormattedMessage {...messages.button.reset} />
        </Menu.Item>
        <Menu.Item key="delete" disabled={hostItem.clusters.length > 0} host={hostItem}>
          <FormattedMessage {...messages.button.delete} />
        </Menu.Item>
      </Menu>
    );
    const MoreBtn = ({ hostItem }) => (
      <Dropdown overlay={menu(hostItem)}>
        <a>
          <FormattedMessage {...messages.button.more} /> <Icon type="down" />
        </a>
      </Dropdown>
    );
    return (
      <PageHeaderLayout>
        <div className={styles.standardList}>
          <Card
            className={styles.listCard}
            bordered={false}
            title={intl.formatMessage(messages.title.hostList)}
            style={{ marginTop: 24 }}
            bodyStyle={{ padding: '0 32px 40px 32px' }}
          >
            <Button
              onClick={this.onClickAddHost}
              type="dashed"
              style={{ width: '100%', marginBottom: 8 }}
              icon="plus"
            >
              <FormattedMessage {...messages.button.add} />
            </Button>
            <List
              size="large"
              rowKey="id"
              loading={loadingHosts}
              pagination={paginationProps}
              dataSource={hosts}
              renderItem={item => (
                <List.Item
                  actions={[
                    <a onClick={() => this.editHost(item)}>
                      <FormattedMessage {...messages.button.edit} />
                    </a>,
                    <MoreBtn hostItem={item} />,
                  ]}
                >
                  <List.Item.Meta
                    title={<span>{item.name}</span>}
                    description={
                      <div>
                        <p>{item.worker_api}</p>
                        <p>
                          <span style={{ marginRight: 5 }}>
                            <FormattedMessage {...messages.label.capacity} />: {item.capacity}
                          </span>
                          <span>
                            <FormattedMessage {...messages.label.runningChains} />:{' '}
                            {item.clusters.length}
                          </span>
                        </p>
                      </div>
                    }
                  />
                  <ListContent data={item} />
                </List.Item>
              )}
            />
          </Card>
        </div>
      </PageHeaderLayout>
    );
  }
}

export default injectIntl(Host);
