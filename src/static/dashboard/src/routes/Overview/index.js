/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { Component, Fragment } from 'react';
import { Row, Col, Card, Radio } from 'antd';
import { connect } from 'dva';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Pie } from 'components/Charts';
import styles from './index.less';

const messages = defineMessages({
  title: {
    host: {
      id: 'Overview.Title.Host',
      defaultMessage: 'Host',
    },
    cluster: {
      id: 'Overview.Title.Cluster',
      defaultMessage: 'Cluster',
    },
    status: {
      id: 'Overview.Title.Status',
      defaultMessage: 'Status',
    },
    type: {
      id: 'Overview.Title.Type',
      defaultMessage: 'Type',
    },
  },
});

@connect(({ overview, loading }) => ({
  overview,
  loadingClusterStatus: loading.effects['overview/fetchClusterStatus'],
  loadingHostStatus: loading.effects['overview/fetchHostStatus'],
}))
export default class Analysis extends Component {
  state = {
    hostTypeValue: 'type',
    clusterTypeValue: 'type',
  };
  componentDidMount() {
    this.props.dispatch({
      type: 'overview/fetchClusterStatus',
    });
    this.props.dispatch({
      type: 'overview/fetchHostStatus',
    });
  }
  hostTypeChange = e => {
    this.setState({
      hostTypeValue: e.target.value,
    });
  };
  clusterTypeChange = e => {
    this.setState({
      clusterTypeValue: e.target.value,
    });
  };
  render() {
    const { overview, loadingClusterStatus, loadingHostStatus } = this.props;
    const { clusterStatus, clusterTypes, hostStatus, hostTypes } = overview;
    const { clusterTypeValue, hostTypeValue } = this.state;

    return (
      <Fragment>
        <Row gutter={24}>
          <Col xl={12} lg={24} md={24} sm={24} xs={24}>
            <Card
              loading={loadingHostStatus}
              className={styles.pieChartCard}
              bordered={false}
              title={<FormattedMessage {...messages.title.host} />}
              bodyStyle={{ padding: 24 }}
              style={{ marginTop: 24, minHeight: 409 }}
              extra={
                <div className={styles.pieChartCardExtra}>
                  <div className={styles.pieChartTypeRadio}>
                    <Radio.Group value={hostTypeValue} onChange={this.hostTypeChange}>
                      <Radio.Button value="status">
                        <FormattedMessage {...messages.title.status} />
                      </Radio.Button>
                      <Radio.Button value="type">
                        <FormattedMessage {...messages.title.type} />
                      </Radio.Button>
                    </Radio.Group>
                  </div>
                </div>
              }
            >
              <h4 style={{ marginTop: 8, marginBottom: 32 }}>
                <FormattedMessage {...messages.title.host} />{' '}
                <span className={styles.pieChartSubTitle}>
                  <FormattedMessage {...messages.title[hostTypeValue]} />
                </span>
              </h4>
              <Pie
                hasLegend
                subTitle={
                  <span className={styles.pieChartSubTitle}>
                    <FormattedMessage {...messages.title[hostTypeValue]} />
                  </span>
                }
                total={() => (
                  <span>
                    {hostTypeValue === 'type'
                      ? hostTypes.reduce((pre, now) => now.y + pre, 0)
                      : hostStatus.reduce((pre, now) => now.y + pre, 0)}
                  </span>
                )}
                data={hostTypeValue === 'type' ? hostTypes : hostStatus}
                height={248}
                lineWidth={4}
              />
            </Card>
          </Col>
          <Col xl={12} lg={24} md={24} sm={24} xs={24}>
            <Card
              className={styles.pieChartCard}
              loading={loadingClusterStatus}
              bordered={false}
              title={<FormattedMessage {...messages.title.cluster} />}
              bodyStyle={{ padding: 24 }}
              style={{ marginTop: 24, minHeight: 409 }}
              extra={
                <div className={styles.pieChartCardExtra}>
                  <div className={styles.pieChartTypeRadio}>
                    <Radio.Group value={clusterTypeValue} onChange={this.clusterTypeChange}>
                      <Radio.Button value="status">
                        <FormattedMessage {...messages.title.status} />
                      </Radio.Button>
                      <Radio.Button value="type">
                        <FormattedMessage {...messages.title.type} />
                      </Radio.Button>
                    </Radio.Group>
                  </div>
                </div>
              }
            >
              <h4 style={{ marginTop: 8, marginBottom: 32 }}>
                <FormattedMessage {...messages.title.cluster} />{' '}
                <span className={styles.pieChartSubTitle}>
                  <FormattedMessage {...messages.title[clusterTypeValue]} />
                </span>
              </h4>
              <Pie
                hasLegend
                subTitle={
                  <span className={styles.pieChartSubTitle}>
                    <FormattedMessage {...messages.title[clusterTypeValue]} />
                  </span>
                }
                total={() => (
                  <span>
                    {clusterTypeValue === 'type'
                      ? clusterTypes.reduce((pre, now) => now.y + pre, 0)
                      : clusterStatus.reduce((pre, now) => now.y + pre, 0)}
                  </span>
                )}
                data={clusterTypeValue === 'type' ? clusterTypes : clusterStatus}
                height={248}
                lineWidth={4}
              />
            </Card>
          </Col>
        </Row>
      </Fragment>
    );
  }
}
