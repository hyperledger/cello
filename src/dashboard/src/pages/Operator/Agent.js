import React, { PureComponent } from 'react';
import { connect } from 'dva';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

@connect(() => ({}))
class Agent extends PureComponent {
  render() {
    return (
      <PageHeaderWrapper>
        Agent
      </PageHeaderWrapper>
    );
  }
}

export default Agent;
