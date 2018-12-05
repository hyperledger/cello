import React, { PureComponent } from 'react';
import moment from 'moment';
import { connect } from 'dva';
import { Link } from 'dva/router';
import pathToRegexp from 'path-to-regexp';
import { Row, Col, Card, List, Avatar, Tooltip, Icon, Badge, Alert } from 'antd';

import Ellipsis from 'components/Ellipsis';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';

import styles from './index.less';

moment.locale('en');

@connect(({ chain, loading }) => ({
  chain,
  loadingSummary: loading.effects['chain/queryChain'],
}))
export default class Index extends PureComponent {
  componentDidMount() {
    const { location, dispatch } = this.props;
    const info = pathToRegexp('/chain/info/:id').exec(location.pathname);
    if (info) {
      const id = info[1];
      dispatch({
        type: 'chain/queryChain',
        payload: {
          id,
          type: "summary",
        },
      });
    }
  }

  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'chain/clearCurrentChain',
    });
  }

  renderActivities() {
    const { chain: { operations }} = this.props;
    return operations.map(item => {
      const operate = item.operate.replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => { return str.toUpperCase(); });
      const { success } = item;
      return (
        <List.Item key={item.id}>
          <List.Item.Meta
            avatar={<Avatar
              icon={success ? "check-circle-o" : "close-circle-o"}
              style={{ backgroundColor: success ? '#0AA679' : 'red' }}
            />}
            title={
              <span>
                <a className={styles.username}>{operate}</a>
                &nbsp;
                <span className={styles.event}>
                  {item.smartContract && item.smartContract.name} {item.smartContractCode && item.smartContractCode.version}&nbsp;&nbsp;
                  {item.fcn && <span>Function: {item.fcn}</span>}&nbsp;&nbsp;
                  {item.arguments && <span>Arguments: {Array.isArray(item.arguments) ? item.arguments.join(',') : item.arguments}</span>}
                  {item.error && <div><Alert type="error" message={item.error} /></div>}
                </span>
              </span>
            }
            description={
              <span className={styles.datetime} title={item.createdAt}>
                {moment.utc(item.createdAt).fromNow()}
              </span>
            }
          />
        </List.Item>
      );
    });
  }

  render() {
    const { chain, loadingSummary } = this.props;
    const { currentChain, deploys, height, recentBlock, recentTransaction, channels, installedChainCodes, instantiatedChainCodes } = chain;
    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <div className={styles.avatar}>
          <Avatar
            size="large"
            icon="link"
            style={{ backgroundColor: '#1890ff', fontSize: 38, paddingTop: 14 }}
          />
        </div>
        <div className={styles.content}>
          <div className={styles.contentTitle}>{currentChain.name}</div>
          <div>Apply Time: {moment(currentChain.createdAt).format('YYYY-MM-DD HH:mm')}</div>
          <div>Type: {currentChain.type}</div>
        </div>
      </div>
    );

    const extraContent = (
      <div className={styles.extraContent}>
        <div className={styles.statItem}>
          <p>
            Size&nbsp;
            <Tooltip title="Peer Number of chain">
              <Icon type="question-circle-o" />
            </Tooltip>
          </p>
          <p>{currentChain.size || 0}</p>
        </div>
        <div className={styles.statItem}>
          <p>Block Height</p>
          <p>{height}</p>
        </div>
        <div className={styles.statItem}>
          <p>Channel Count</p>
          <p>
            {channels.length}
          </p>
        </div>
        <div className={styles.statItem}>
          <p>
            Smart Contract&nbsp;
            <Tooltip title="Instantiated / Installed">
              <Icon type="question-circle-o" />
            </Tooltip>
          </p>
          <p>
            {instantiatedChainCodes ? instantiatedChainCodes.length : 0}<span> / {installedChainCodes ? installedChainCodes.length : 0}</span>
          </p>
        </div>
      </div>
    );

    return (
      <PageHeaderLayout loading={loadingSummary} content={pageHeaderContent} extraContent={extraContent}>
        <Row gutter={24}>
          <Col xl={16} lg={24} md={24} sm={24} xs={24}>
            <Card
              className={styles.projectList}
              style={{ marginBottom: 24 }}
              title="Deployed Smart Contract"
              bordered={false}
              extra={<span><Link to="/">All</Link> | <Link to="/smart-contract/index">New</Link></span>}
              loading={loadingSummary}
              bodyStyle={{ padding: 0 }}
            >
              {deploys.map(item => (
                <Card.Grid className={styles.projectGrid} key={item.objectId}>
                  <Card bodyStyle={{ padding: 0 }} bordered={false}>
                    <Card.Meta
                      title={
                        <div className={styles.cardTitle}>
                          <Avatar
                            size="small"
                            style={{ backgroundColor: '#1890ff' }}
                            icon="api"
                          />
                          <Link to={`/smart-contract/invoke-query/${item.objectId}`}>{item.smartContract.name} / {item.smartContractCode.version}</Link>
                        </div>
                      }
                      description={item.smartContract.description}
                    />
                    <div className={styles.projectItemContent}>
                      <Link to={`/smart-contract/invoke-query/${item.objectId}`}>
                        <Badge status='success' text={<span className={styles["status-text"]}>{item.status}</span>} />
                      </Link>
                      {item.deployTime && (
                        <span className={styles.datetime} title={item.deployTime}>
                          {moment(item.deployTime).fromNow()}
                        </span>
                      )}
                    </div>
                  </Card>
                </Card.Grid>
              ))}
            </Card>
            <Card
              bodyStyle={{ padding: 0 }}
              bordered={false}
              className={styles.activeCard}
              title="Operation History"
              loading={loadingSummary}
            >
              <List loading={loadingSummary} size="large">
                <div className={styles.activitiesList}>{this.renderActivities()}</div>
              </List>
            </Card>
          </Col>
          <Col xl={8} lg={24} md={24} sm={24} xs={24}>
            <Card bodyStyle={{ paddingTop: 12, paddingBottom: 12, marginBottom: 24 }} bordered={false} title="Channels">
              <div className={styles.members}>
                <Row gutter={48}>
                  {channels.map(item => (
                    <Col span={12}>
                      <a>
                        <Avatar
                          icon="retweet"
                          className={styles["channel-card"]}
                          style={{ backgroundColor: '#0AA679' }}
                          size="small"
                        />
                        <span className={styles.member}>{item}</span>
                      </a>
                    </Col>
                  ))}
                </Row>
              </div>
            </Card>
            <Card bodyStyle={{ paddingTop: 12, paddingBottom: 12, marginBottom: 24 }} bordered={false} title="Recent Blocks">
              <List
                className={styles["card-list"]}
                loading={loadingSummary}
                dataSource={recentBlock}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Ellipsis lines={2}>
                          {item && item.hash}
                        </Ellipsis>
                      }
                      description={item && moment(item.timestamp).format('YYYY-MM-DD HH:mm')}
                    />
                  </List.Item>
                )}
              />
            </Card>
            <Card bodyStyle={{ paddingTop: 12, paddingBottom: 12, marginBottom: 24 }} bordered={false} title="Recent Transactions">
              <List
                className={styles["card-list"]}
                loading={loadingSummary}
                dataSource={recentTransaction || []}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Ellipsis lines={2}>
                          {item && item.id}
                        </Ellipsis>
                      }
                      description={item && moment(item.timestamp).format('YYYY-MM-DD HH:mm')}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </PageHeaderLayout>
    );
  }
}
