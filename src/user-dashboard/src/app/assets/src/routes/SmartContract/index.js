/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent } from 'react';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import { Card, Button, Icon, List, Avatar, Modal, message } from 'antd';
import QueueAnim from 'rc-queue-anim';

import Ellipsis from 'components/Ellipsis';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';

import styles from './index.less';

@connect(({ smartContract, loading }) => ({
  smartContract,
  loadingSmartContracts: loading.effects['smartContract/fetch'],
}))
export default class SmartContract extends PureComponent {
  componentDidMount() {
    this.props.dispatch({
      type: 'smartContract/fetch',
    });
  }
  newSmartContract = () => {
    this.props.dispatch(
      routerRedux.push({
        pathname: '/smart-contract/new',
      })
    );
  };
  deleteCallback = ( payload ) => {
    message.success(`Delete smart contract ${payload.name} successfully.`);
    this.props.dispatch({
      type: 'smartContract/fetch',
    });
  };
  deleteSmartContract = (smartContract) => {
    const { dispatch } = this.props;
    const { deleteCallback } = this;
    Modal.confirm({
      title: `Do you want to delete smart contract ${smartContract.name}?`,
      onOk() {
        dispatch({
          type: 'smartContract/deleteSmartContract',
          payload: {
            id: smartContract.objectId,
            callback: deleteCallback,
          },
        })
      },
      onCancel() {
      },
    });
  };
  smartContractInfo = (smartContract) => {
    this.props.dispatch(routerRedux.push({
      pathname: `/smart-contract/info/${smartContract.objectId}`,
    }));
  };
  render() {
    const { smartContract: { smartContracts }, loadingSmartContracts } = this.props;
    const content = (
      <div className={styles.pageHeaderContent}>
        <p>
          You can upload,install,instantiate smart contract into chains applied.
        </p>
      </div>
    );

    const extraContent = (
      <div className={styles.extraImg}>
        <QueueAnim>
          <Icon key="smart-contract" type="code-o" style={{fontSize: 80}} />
        </QueueAnim>
      </div>
    );

    return (
      <PageHeaderLayout title="Smart Contract Management" content={content} extraContent={extraContent}>
        <div className={styles.cardList}>
          <List
            rowKey="id"
            loading={loadingSmartContracts}
            grid={{ gutter: 24, lg: 3, md: 2, sm: 1, xs: 1 }}
            dataSource={['', ...smartContracts]}
            renderItem={item =>
              item ? (
                <List.Item key={item.objectId}>
                  <Card hoverable className={styles.card} actions={[<a onClick={() => this.smartContractInfo(item)}>Info</a>, <a style={{color: 'red'}} onClick={() => this.deleteSmartContract(item)}>Delete</a>]}>
                    <Card.Meta
                      avatar={
                        <Avatar size="large" style={{ backgroundColor: '#08c' }} icon="link" />
                      }
                      title={<a onClick={() => this.smartContractInfo(item)}>{item.name}</a>}
                      onClick={() => this.smartContractInfo(item)}
                      description={
                        <Ellipsis className={styles.item} lines={3}>
                          {item.description}
                        </Ellipsis>
                      }
                    />
                  </Card>
                </List.Item>
              ) : (
                <List.Item>
                  <Button type="dashed" className={styles.newButton} onClick={this.newSmartContract}>
                    <Icon type="plus" /> New Smart Contract
                  </Button>
                </List.Item>
              )
            }
          />
        </div>
      </PageHeaderLayout>
    );
  }
}
