/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { List, Card, Button, Dropdown, Menu, Icon, Badge, Modal, Radio } from 'antd';
import { routerRedux } from 'dva/router';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './style.less';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

const messages = defineMessages({
  title: {
    id: 'Chain.Title',
    defaultMessage: 'Chains',
  },
  button: {
    add: {
      id: 'Chain.Button.Add',
      defaultMessage: 'Add',
    },
    more: {
      id: 'Chain.Button.More',
      defaultMessage: 'More',
    },
    restart: {
      id: 'Chain.Button.Restart',
      defaultMessage: 'Restart',
    },
    start: {
      id: 'Chain.Button.Start',
      defaultMessage: 'Start',
    },
    stop: {
      id: 'Chain.Button.Stop',
      defaultMessage: 'Stop',
    },
    release: {
      id: 'Chain.Button.Release',
      defaultMessage: 'Release',
    },
    delete: {
      id: 'Chain.Button.Delete',
      defaultMessage: 'Delete',
    },
  },
  label: {
    networkType: {
      id: 'Chain.Label.NetworkType',
      defaultMessage: 'Network Type',
    },
    consensusPlugin: {
      id: 'Chain.Label.ConsensusPlugin',
      defaultMessage: 'Consensus Plugin',
    },
    owner: {
      id: 'Chain.Label.Owner',
      defaultMessage: 'Owner',
    },
    createTime: {
      id: 'Chain.Label.CreateTime',
      defaultMessage: 'Create Time',
    },
  },
  radio: {
    option: {
      active: {
        id: 'Chain.Radio.Option.Active',
        defaultMessage: 'Active',
      },
      released: {
        id: 'Chain.Radio.Option.Released',
        defaultMessage: 'Released',
      },
    },
  },
  message: {
    confirm: {
      deleteChain: {
        id: 'Chain.Messages.Confirm.DeleteChain',
        defaultMessage: 'Do you want to delete chan {name}?',
      },
    },
  },
});

@connect(({ chain, loading }) => ({
  chain,
  loadingChains: loading.effects['chain/fetchChains'],
}))
class Chain extends PureComponent {
  componentDidMount() {
    this.props.dispatch({
      type: 'chain/fetchChains',
    });
  }
  onClickAddChain = () => {
    this.props.dispatch(
      routerRedux.push({
        pathname: '/create-chain',
      })
    );
  };
  changeChainType = e => {
    this.props.dispatch({
      type: 'chain/fetchChains',
      payload: {
        state: e.target.value,
      },
    });
  };
  clickMore = ({ item, key }) => {
    const { dispatch, intl } = this.props;
    const { id, name } = item.props.chain;
    const values = { name };
    switch (key) {
      case 'delete':
        Modal.confirm({
          title: intl.formatMessage(messages.message.confirm.deleteChain, values),
          onOk() {
            dispatch({
              type: 'chain/deleteChain',
              payload: {
                id,
                col_name: 'active',
              },
            });
          },
        });
        break;
      case 'start':
      case 'stop':
      case 'restart':
      case 'release':
        dispatch({
          type: 'chain/operateChain',
          payload: {
            cluster_id: id,
            action: key,
            name,
          },
        });
        break;
      default:
        break;
    }
  };
  render() {
    const { loadingChains, chain, intl } = this.props;
    const { chains } = chain;
    const paginationProps = {
      showSizeChanger: true,
      showQuickJumper: true,
      pageSize: 5,
      total: chains.length,
    };
    function badgeStatus(status) {
      switch (status) {
        case 'running':
          return 'success';
        case 'error':
          return 'error';
        case 'stopped':
          return 'default';
        default:
          break;
      }
    }
    const ListContent = ({ data: { user_id, create_ts, status } }) => (
      <div className={styles.listContent}>
        <div className={styles.listContentItem}>
          <span>
            <FormattedMessage {...messages.label.owner} />
          </span>
          <p>{user_id === '' ? 'Empty' : user_id}</p>
        </div>
        <div className={styles.listContentItem}>
          <span>
            <FormattedMessage {...messages.label.createTime} />
          </span>
          <p>{create_ts}</p>
        </div>
        <div className={styles.listContentItem}>
          <Badge className={styles['status-badge']} status={badgeStatus(status)} text={status} />
        </div>
      </div>
    );
    const menu = chainItem => (
      <Menu onClick={this.clickMore}>
        <Menu.Item key="restart" chain={chainItem}>
          <FormattedMessage {...messages.button.restart} />
        </Menu.Item>
        <Menu.Item disabled={chainItem.status === 'running'} key="start" chain={chainItem}>
          <FormattedMessage {...messages.button.start} />
        </Menu.Item>
        <Menu.Item key="stop" disabled={chainItem.status === 'stopped'} chain={chainItem}>
          <FormattedMessage {...messages.button.stop} />
        </Menu.Item>
        <Menu.Item key="release" chain={chainItem}>
          <FormattedMessage {...messages.button.release} />
        </Menu.Item>
        <Menu.Item key="delete" chain={chainItem}>
          <span className={styles['delete-button']}>
            <FormattedMessage {...messages.button.delete} />
          </span>
        </Menu.Item>
      </Menu>
    );
    const MoreBtn = ({ chainItem }) => (
      <Dropdown overlay={menu(chainItem)}>
        <a>
          <FormattedMessage {...messages.button.more} /> <Icon type="down" />
        </a>
      </Dropdown>
    );
    const extraContent = (
      <div className={styles.extraContent}>
        <RadioGroup defaultValue="active" onChange={this.changeChainType}>
          <RadioButton value="active">
            <FormattedMessage {...messages.radio.option.active} />
          </RadioButton>
          <RadioButton value="released">
            <FormattedMessage {...messages.radio.option.released} />
          </RadioButton>
        </RadioGroup>
      </div>
    );
    return (
      <PageHeaderLayout>
        <div className={styles.standardList}>
          <Card
            className={styles.listCard}
            bordered={false}
            title={intl.formatMessage(messages.title)}
            style={{ marginTop: 24 }}
            bodyStyle={{ padding: '0 32px 40px 32px' }}
            extra={extraContent}
          >
            <Button
              onClick={this.onClickAddChain}
              type="dashed"
              style={{ width: '100%', marginBottom: 8 }}
              icon="plus"
            >
              <FormattedMessage {...messages.button.add} />
            </Button>
            <List
              size="large"
              rowKey="id"
              loading={loadingChains}
              pagination={paginationProps}
              dataSource={chains}
              renderItem={item => (
                <List.Item actions={[<MoreBtn chainItem={item} />]}>
                  <List.Item.Meta
                    title={<span>{item.name}</span>}
                    description={
                      <div>
                        <p>
                          <FormattedMessage {...messages.label.networkType} />: {item.network_type}
                        </p>
                        <p>
                          <FormattedMessage {...messages.label.consensusPlugin} />:{' '}
                          {item.consensus_plugin}
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

export default injectIntl(Chain);
