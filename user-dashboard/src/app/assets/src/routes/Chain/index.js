/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent } from 'react';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import { Card, Button, Icon, List, Avatar, Modal } from 'antd';
import QueueAnim from 'rc-queue-anim';

import Ellipsis from 'components/Ellipsis';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import config from '../../utils/config';

import styles from './index.less';

@connect(({ chain, loading }) => ({
  chain,
  loading: loading.effects['chain/fetch'],
}))
export default class CardList extends PureComponent {
  componentDidMount() {
    this.props.dispatch({
      type: 'chain/fetch',
    })
  }
  releaseChain = (chain) => {
    const { dispatch } = this.props;
    Modal.confirm({
      title: `Do you want to release chain ${chain.name}?`,
      onOk() {
        dispatch({
          type: 'chain/release',
          payload: {
            id: chain.chainId,
          },
        })
      },
      onCancel() {
      },
    });
  };
  applyChain = () => {
    this.props.dispatch(
      routerRedux.push({
        pathname: '/apply-chain',
      })
    );
  };

  render() {
    const { chain: { chains }, loading } = this.props;
    const imageSrc = `${window.webRoot}static/chain.png`;
    const content = (
      <div className={styles.pageHeaderContent}>
        <p>
          You can create,list,manage chains here.
        </p>
      </div>
    );

    const extraContent = (
      <div className={styles.extraImg}>
        <QueueAnim>
          <img
            key="image-logo"
            alt="chain"
            src={imageSrc}
          />
        </QueueAnim>
      </div>
    );

    return (
      <PageHeaderLayout title="Chain List" content={content} extraContent={extraContent}>
        <div className={styles.cardList}>
          <List
            rowKey="id"
            loading={loading}
            grid={{ gutter: 24, lg: 3, md: 2, sm: 1, xs: 1 }}
            dataSource={['', ...chains]}
            renderItem={item =>
              item ? (
                <List.Item key={item._id}>
                  <Card hoverable className={styles.card} actions={[<a>Info</a>, <a onClick={() => this.releaseChain(item)}>Release</a>, <a href={config.url.chain.downloadNetworkConfig.format({ id: item._id })}><Icon type="download" /></a>]}>
                    <Card.Meta
                      avatar={
                        <Avatar size="large" style={{ backgroundColor: '#08c' }} icon="link" />
                      }
                      title={<a href="#">{item.name}</a>}
                      description={
                        <Ellipsis className={styles.item} lines={3}>
                          {item.type}
                        </Ellipsis>
                      }
                    />
                  </Card>
                </List.Item>
              ) : (
                <List.Item>
                  <Button type="dashed" className={styles.newButton} onClick={this.applyChain}>
                    <Icon type="plus" /> New Chain
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
