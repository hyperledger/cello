import React, { PureComponent, Fragment } from 'react';
import { Card, Steps } from 'antd';
import { injectIntl } from 'umi';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

const { Step } = Steps;

class Index extends PureComponent {
  getCurrentStep() {
    const { location } = this.props;
    const { pathname } = location;
    const pathList = pathname.split('/');
    switch (pathList[pathList.length - 1]) {
      case 'basic-info':
        return 0;
      case 'node-info':
        return 1;
      default:
        return 0;
    }
  }

  render() {
    const { location, children, intl } = this.props;
    return (
      <PageHeaderWrapper
        title={
          intl.formatMessage({ id: 'app.operator.node.new.title', defaultMessage: 'Create Node' })
        }
        tabActiveKey={location.pathname}
      >
        <Card bordered={false}>
          <Fragment>
            <Steps current={this.getCurrentStep()}>
              <Step
                title={intl.formatMessage({
                  id: 'menu.operator.newNode.basicInfo',
                  defaultMessage: 'Input Node Basic Information',
                })}
              />
              <Step
                title={intl.formatMessage({
                  id: 'menu.operator.newNode.nodeInfo',
                  defaultMessage: 'Input Special Information For Node',
                })}
              />
            </Steps>
            {children}
          </Fragment>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default injectIntl(Index);
