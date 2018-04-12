/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent } from 'react';
import { Card } from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';

export default class Chain extends PureComponent {
  render() {
    return (
      <PageHeaderLayout title="User Management" content="Manage Users">
        <Card bordered={false}>User management</Card>
      </PageHeaderLayout>
    );
  }
}
