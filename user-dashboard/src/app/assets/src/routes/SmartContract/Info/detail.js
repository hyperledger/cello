/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { Component, Fragment } from 'react';
import {
  Card,
  Button,
  Table,
  Divider,
} from 'antd';
import moment from 'moment';
import styles from './index.less';


export default class Detail extends Component {

  render() {
    const { codes, loadingInfo, onAddNewCode, onDeploy } = this.props;
    const codeColumns = [
      {
        title: 'Version',
        dataIndex: 'version',
        key: 'version',
      },
      {
        title: 'Create Time',
        dataIndex: 'createTime',
        key: 'createTime',
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
    return (
      <div>
        <Card
          title="Code List"
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
