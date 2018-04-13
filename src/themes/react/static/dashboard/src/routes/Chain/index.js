/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent } from 'react';
import { Card } from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';

export default class Chain extends PureComponent {
  render() {
    return (
      <PageHeaderLayout title="Chain Management" content="Manage Chain">
        <Card bordered={false}>Chain Management</Card>
      </PageHeaderLayout>
    );
  }
}
