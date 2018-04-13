/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent } from 'react';
import { Card } from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';

export default class Host extends PureComponent {
  render() {
    return (
      <PageHeaderLayout title="Host Management" content="Manage host">
        <Card bordered={false}>Host Management</Card>
      </PageHeaderLayout>
    );
  }
}
