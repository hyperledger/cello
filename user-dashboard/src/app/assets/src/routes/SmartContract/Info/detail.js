/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { Component, Fragment } from 'react';
import {
  Card,
  Button,
  Table,
  Divider,
  Badge,
} from 'antd';
import moment from 'moment';
import styles from './index.less';


export default class Detail extends Component {

  render() {
    const { codes, loadingInfo, onAddNewCode, onDeploy, deploys, onInvokeQuery } = this.props;
    const codeColumns = [
      {
        title: 'Version',
        dataIndex: 'version',
        key: 'version',
      },
      {
        title: 'Create Time',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: text => moment(text).format('YYYY-MM-DD HH:mm:ss'),
      },
      {
        title: 'Operate',
        render: ( text, record ) => (
          <Fragment>
            <a onClick={() => onDeploy(record)}>Deploy</a>
            <Divider type="vertical" />
            <a style={{color: 'red'}}>Delete</a>
          </Fragment>
        ),
      },
    ];
    const deployColumns = [
      {
        title: 'Chain',
        dataIndex: 'chain',
        key: 'chain',
        render: text => text.name,
      },
      {
        title: 'Code Version',
        dataIndex: 'smartContractCode',
        key: 'smartContractCode',
        render: text => text.version,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: ( text ) => {
          let status = "default";
          switch (text) {
            case 'installed':
            case 'instantiated':
              status = "success";
              break;
            case 'instantiating':
              status = "processing";
              break;
            case 'error':
              status = "error";
              break;
            default:
              break;
          }

          return <Badge status={status} text={<span className={styles["status-text"]}>{text}</span>} />;
        },
      },
      {
        title: 'Deploy Time',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: text => moment(text).format("YYYY-MM-DD HH:mm:ss"),
      },
      {
        title: 'Operate',
        render: ( text, record ) => (
          <Fragment>
            <Button onClick={() => onInvokeQuery(record)} type="primary" icon="api" size="small" disabled={record.status !== 'instantiated'}>Invoke/Query</Button>
          </Fragment>
        ),
      },
    ];
    return (
      <div>
        <Card
          title="Deployment List"
          bordered={false}
        >
          <div className={styles.tableList}>
            <Table
              pagination={false}
              loading={loadingInfo}
              columns={deployColumns}
              dataSource={deploys}
            />
          </div>
        </Card>
        <Card
          title="Code List"
          style={{marginTop: 20}}
          bordered={false}
        >
          <div className={styles.tableList}>
            <div className={styles.tableListOperator}>
              <Button icon="plus" type="primary" onClick={onAddNewCode}>
                New
              </Button>
            </div>
            <Table
              pagination={false}
              loading={loadingInfo}
              columns={codeColumns}
              dataSource={codes}
            />
          </div>
        </Card>
      </div>
    );
  }
}
