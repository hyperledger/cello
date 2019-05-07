import React, { PureComponent } from 'react';
import { connect } from 'dva';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

@connect(() => ({}))
class UserManagement extends PureComponent {
  render() {
    return (
      <PageHeaderWrapper>
        User Management
      </PageHeaderWrapper>
    );
  }
}

export default UserManagement;
