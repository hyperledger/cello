import React, { PureComponent } from 'react';
import moment from 'moment';
import { connect } from 'dva';
import { routerRedux, Link } from 'dva/router';
import {
  List,
  Card,
  Row,
  Col,
  Radio,
  Button,
  Avatar,
  Badge,
} from 'antd';

import PageHeaderLayout from '../../../layouts/PageHeaderLayout';

import styles from './index.less';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

@connect(({ deploy, loading }) => ({
  deploy,
  loadingDeploys: loading.effects['deploy/fetch'],
}))
export default class BasicList extends PureComponent {
  state = {
    pageSize: 5,
  };
  componentDidMount() {
    this.props.dispatch({
      type: 'deploy/fetch',
      payload: {
        count: 5,
      },
    });
  }
  changeStatus = e => {
    this.props.dispatch({
      type: 'deploy/fetch',
      payload: {
        status: e.target.value,
      },
    })
  };
  invokeQuery = (deploy) => {
    this.props.dispatch(routerRedux.push({
      pathname: `/smart-contract/invoke-query/${deploy.objectId}`,
    }));
  };

  render() {
    const { deploy: { deploys, total, instantiatedCount, errorCount }, loadingDeploys } = this.props;
    const { pageSize } = this.state;

    const Info = ({ title, value, bordered }) => (
      <div className={styles.headerInfo}>
        <span>{title}</span>
        <p>{value}</p>
        {bordered && <em />}
      </div>
    );

    const extraContent = (
      <div className={styles.extraContent}>
        <RadioGroup defaultValue="" onChange={this.changeStatus}>
          <RadioButton value="">All</RadioButton>
          <RadioButton value="instantiating">Instantiating</RadioButton>
          <RadioButton value="instantiated">Instantiated</RadioButton>
          <RadioButton value="error">Error</RadioButton>
        </RadioGroup>
      </div>
    );

    const paginationProps = {
      showSizeChanger: true,
      showQuickJumper: true,
      pageSize,
      total,
    };

    function getStatus(status) {
      switch (status) {
        case 'installed':
        case 'instantiated':
          return "success";
        case 'instantiating':
          return "processing";
        case 'error':
          return "error";
        default:
          return "default";
      }
    }

    const ListContent = ({ data: { chain, deployTime, status } }) => (
      <div className={styles.listContent}>
        <div className={styles.listContentItem}>
          <span>Chain Name/Size</span>
          <p>{chain.name} / {chain.size}</p>
        </div>
        <div className={styles.listContentItem}>
          <span>Deploy Time</span>
          <p>{moment(deployTime).format('YYYY-MM-DD HH:mm')}</p>
        </div>
        <div className={styles.listContentItem}>
          <Badge status={getStatus(status)} text={status} className={styles["status-text"]} />
        </div>
      </div>
    );

    return (
      <PageHeaderLayout>
        <div className={styles.standardList}>
          <Card bordered={false}>
            <Row>
              <Col sm={8} xs={24}>
                <Info title="Total" value={total} bordered />
              </Col>
              <Col sm={8} xs={24}>
                <Info title="Instantiated" value={instantiatedCount} bordered />
              </Col>
              <Col sm={8} xs={24}>
                <Info title="Error" value={errorCount} />
              </Col>
            </Row>
          </Card>

          <Card
            className={styles.listCard}
            bordered={false}
            title="Deployment List"
            style={{ marginTop: 24 }}
            bodyStyle={{ padding: '0 32px 40px 32px' }}
            extra={extraContent}
          >
            <List
              size="large"
              rowKey="objectId"
              loading={loadingDeploys}
              pagination={paginationProps}
              dataSource={deploys}
              renderItem={item => (
                <List.Item actions={[<Button onClick={() => this.invokeQuery(item)} disabled={item.status !== 'instantiated'} size="small" icon="api" type="primary">Invoke/Query</Button>]}>
                  <List.Item.Meta
                    avatar={<Avatar style={{color: '#40a9ff'}} icon="api" shape="square" size="large" />}
                    title={<span><Link to={`/smart-contract/info/${item.smartContract.objectId}`}>{item.smartContract.name}</Link> / {item.smartContractCode.version}</span>}
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
