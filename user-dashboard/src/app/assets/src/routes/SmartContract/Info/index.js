/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { Component, Fragment } from 'react';
import Debounce from 'lodash-decorators/debounce';
import Bind from 'lodash-decorators/bind';
import pathToRegexp from 'path-to-regexp';
import { connect } from 'dva';
import moment from 'moment';
import { routerRedux } from 'dva/router';
import {
  Button,
  Icon,
  Tag,
} from 'antd';
import DescriptionList from 'components/DescriptionList';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import styles from './index.less';
import History from './history';
import Deploy from './deploy';
import Detail from './detail'

const { Description } = DescriptionList;

const getWindowWidth = () => window.innerWidth || document.documentElement.clientWidth;

const action = (
  <Fragment>
    <Button type="danger">Delete</Button>
  </Fragment>
);

const tabList = [
  {
    key: 'detail',
    tab: 'Detail',
  },
  {
    key: 'history',
    tab: 'History',
  },
  {
    key: 'deploy',
    tab: 'Deploy',
  },
];

@connect(({ smartContract, chain, loading }) => ({
  smartContract,
  chain,
  loadingInfo: loading.effects['smartContract/querySmartContract'],
}))
export default class AdvancedProfile extends Component {
  state = {
    operationKey: 'detail',
    stepDirection: 'horizontal',
    selectedVersion: '',
    selectedVersionId: '',
    deployStep: 0,
  };

  componentDidMount() {
    const { location, dispatch } = this.props;
    const info = pathToRegexp('/smart-contract/info/:id').exec(location.pathname);
    if (info) {
      const id = info[1];
      dispatch({
        type: 'smartContract/querySmartContract',
        payload: {
          id,
        },
      });
    }
    this.props.dispatch({
      type: 'chain/fetch',
    });
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
      deployStep: 0,
      selectedVersion: '',
      selectedVersionId: '',
    });
  };

  onAddNewCode = () => {
    const { smartContract, dispatch } = this.props;
    const { currentSmartContract } = smartContract;
    dispatch(routerRedux.push({
      pathname: `/smart-contract/new-code/${currentSmartContract.objectId}`,
    }));
  };
  onClickDeploy = (smartContractCode) => {
    this.setState({
      deployStep: 1,
      selectedVersion: smartContractCode.version,
      selectedVersionId: smartContractCode.objectId,
      operationKey: 'deploy',
    });
  };
  onDeploy = (payload) => {
    this.props.dispatch({
      type: 'smartContract/deploySmartContract',
      payload,
    })
  };
  onDeployDone = () => {
    const { dispatch } = this.props;
    const { smartContract } = this.props;
    const { currentSmartContract } = smartContract;
    dispatch({
      type: 'smartContract/querySmartContract',
      payload: {
        id: currentSmartContract.objectId,
      },
    });
    this.onOperationTabChange('detail');
  };

  onInvokeQuery = (item) => {
    this.props.dispatch(routerRedux.push({
      pathname: `/smart-contract/invoke-query/${item.objectId}`,
    }));
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
  render() {
    const { smartContract, chain: { chains }, loadingInfo } = this.props;
    const { currentSmartContract, codes, deploys, newOperations } = smartContract;
    const { deployStep, selectedVersion, selectedVersionId } = this.state;
    const versions = codes.map(code => code.version);
    const versionTags = versions.map(version => <Tag>{version}</Tag>);

    const detailProps = {
      codes,
      deploys,
      loadingInfo,
      onAddNewCode: this.onAddNewCode,
      onDeploy: this.onClickDeploy,
      onInvokeQuery: this.onInvokeQuery,
    };
    const deployProps = {
      version: selectedVersion,
      versionId: selectedVersionId,
      current: deployStep,
      chains,
      codes,
      onDeploy: this.onDeploy,
      onDeployDone: this.onDeployDone,
      currentSmartContract,
    };

    const contentList = {
      detail: (
        <Detail {...detailProps} />
      ),
      history: (
        <History loading={loadingInfo} newOperations={newOperations} />
      ),
      deploy: (
        <Deploy {...deployProps} />
      ),
    };

    const description = (
      <DescriptionList className={styles.headerList} size="small" col="2">
        <Description term="Create Time">{currentSmartContract && moment(currentSmartContract.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Description>
        <Description term="Description">{currentSmartContract && currentSmartContract.description}</Description>
        <Description term="Versions">{versionTags}</Description>
      </DescriptionList>
    );

    return (
      <PageHeaderLayout
        title={`Name：${currentSmartContract && currentSmartContract.name}`}
        logo={
          <Icon type="code-o" style={{fontSize: 30, color: '#40a9ff'}} />
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
