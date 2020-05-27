import React, { PureComponent } from 'react';
import { connect } from 'umi';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

@connect(() => ({}))
class Overview extends PureComponent {
  render() {
    return <PageHeaderWrapper>Overview</PageHeaderWrapper>;
  }
}

export default Overview;
