/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { Component } from 'react';
import moment from 'moment';
import {
  Card,
  Badge,
  Table,
} from 'antd';
import styles from './index.less';

const operationTabList = [
  {
    key: 'newOperations',
    tab: 'History of create new code',
  },
];

const newOperationColumns = [
  {
    title: 'Code Version',
    dataIndex: 'smartContractCode',
    key: 'smartContractCode',
    render: item => item.version,
  },
  {
    title: 'Operate Time',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: text => moment(text).format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: text =>
      text === 'success' ? (
        <Badge status="success" text={text} />
      ) : (
        <Badge status="error" text={text} />
      ),
  },
];

export default class History extends Component {
  state = {
    operationKey: 'newOperations',
  };

  onOperationTabChange = key => {
    this.setState({ operationKey: key });
  };

  render() {
    const { loading, newOperations } = this.props;
    const contentList = {
      newOperations: (
        <Table
          pagination={false}
          loading={loading}
          columns={newOperationColumns}
          dataSource={newOperations}
        />
      ),
    };

    return (
      <Card
        className={styles.tabsCard}
        bordered={false}
        tabList={operationTabList}
        onTabChange={this.onOperationTabChange}
      >
        {contentList[this.state.operationKey]}
      </Card>
    );
  }
}
