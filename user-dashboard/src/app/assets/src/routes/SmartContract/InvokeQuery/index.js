/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { Component, Fragment } from 'react';
import Debounce from 'lodash-decorators/debounce';
import Bind from 'lodash-decorators/bind';
import pathToRegexp from 'path-to-regexp';
import { connect } from 'dva';
import moment from 'moment';
import {
  Button,
  Icon,
  message,
  Badge,
} from 'antd';
import DescriptionList from 'components/DescriptionList';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import styles from './index.less';
import OperateDeploy from './operate';

const { Description } = DescriptionList;

const getWindowWidth = () => window.innerWidth || document.documentElement.clientWidth;

const action = (
  <Fragment>
    <Button type="danger">Delete</Button>
  </Fragment>
);

const tabList = [
  {
    key: 'invoke',
    tab: 'Invoke',
  },
  {
    key: 'query',
    tab: 'Query',
  },
];

@connect(({ deploy, loading }) => ({
  deploy,
  loadingInfo: loading.effects['deploy/queryDeploy'],
  operating: loading.effects['deploy/operateDeploy'],
}))
export default class AdvancedProfile extends Component {
  state = {
    deployId: '',
    operationKey: 'invoke',
    stepDirection: 'horizontal',
    queryResult: '',
  };

  componentDidMount() {
    const { location, dispatch } = this.props;
    const info = pathToRegexp('/smart-contract/invoke-query/:id').exec(location.pathname);
    if (info) {
      const id = info[1];
      dispatch({
        type: 'deploy/queryDeploy',
        payload: {
          id,
        },
      });
      this.setState({
        deployId: id,
      })
    }
    this.setStepDirection();
    window.addEventListener('resize', this.setStepDirection);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setStepDirection);
    this.setStepDirection.cancel();
  }

  onOperationTabChange = key => {
    this.setState({
      operationKey: key,
    });
  };


  @Bind()
  @Debounce(200)
  setStepDirection() {
    const { stepDirection } = this.state;
    const w = getWindowWidth();
    if (stepDirection !== 'vertical' && w <= 576) {
      this.setState({
        stepDirection: 'vertical',
      });
    } else if (stepDirection !== 'horizontal' && w > 576) {
      this.setState({
        stepDirection: 'horizontal',
      });
    }
  }
  operateCallback = (data) => {
    const { request, response } = data;
    const { operation } = request;
    switch (operation) {
      case 'invoke': {
        if (response.success) {
          message.success(`${operation} operation successfully, transaction ID ${response.transactionID}`);
        } else {
          message.error(`${operation} operation failed, error message ${response.message}`);
        }
        break;
      }
      case 'query': {
        if (response.success) {
          message.success(`${operation} operation successfully, result ${response.result}`);
          this.setState({
            queryResult: response.result,
          });
        } else {
          message.error(`${operation} operation failed, error message ${response.message}`);
          this.setState({
            queryResult: response.message,
          });
        }
        break;
      }
      default:
        break;
    }
  };
  operateAPI = (data) => {
    const { deployId } = this.state;
    this.props.dispatch({
      type: 'deploy/operateDeploy',
      payload: {
        ...data,
        id: deployId,
        callback: this.operateCallback,
      },
    });
  };
  render() {
    const { deploy, loadingInfo, operating } = this.props;
    const { operationKey, queryResult } = this.state;
    const { currentDeploy } = deploy;

    const invokeProps = {
      operation: 'invoke',
      onSubmit: this.operateAPI,
      submitting: operating,
      currentDeploy,
    };
    const queryProps = {
      operation: 'query',
      onSubmit: this.operateAPI,
      submitting: operating,
      result: queryResult,
      currentDeploy,
    };

    const contentList = {
      invoke: (
        operationKey === 'invoke' && <OperateDeploy {...invokeProps} />
      ),
      query: (
        operationKey === 'query' && <OperateDeploy {...queryProps} />
      ),
    };

    function getStatus(text) {
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
      return status;
    }

    const description = (
      <DescriptionList className={styles.headerList} size="small" col="2">
        <Description term="Smart Contract">{currentDeploy.smartContract && currentDeploy.smartContract.name} / {currentDeploy.smartContractCode && currentDeploy.smartContractCode.version}</Description>
        <Description term="Chain">{currentDeploy.chain && currentDeploy.chain.name}</Description>
        <Description term="Status">{currentDeploy.status && <Badge status={getStatus(currentDeploy.status)} text={currentDeploy.status} className={styles["status-text"]} />}</Description>
        <Description term="Deploy Time">{currentDeploy.deployTime && moment(currentDeploy.deployTime).format("YYYY-MM-DD HH:mm")}</Description>
      </DescriptionList>
    );

    return (
      <PageHeaderLayout
        title="Invoke/Query"
        logo={
          <Icon type="api" style={{fontSize: 30, color: '#40a9ff'}} />
        }
        loading={loadingInfo}
        action={action}
        content={description}
        tabList={tabList}
        tabActiveKey={this.state.operationKey}
        onTabChange={this.onOperationTabChange}
      >
        {contentList[this.state.operationKey]}
      </PageHeaderLayout>
    );
  }
}
