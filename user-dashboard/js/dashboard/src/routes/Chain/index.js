/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Row, Col, Card, List, Avatar, Badge, Button, Modal, Select } from 'antd';
import { routerRedux } from 'dva/router';
import {EmptyView, ChainView, EditModal} from './components'
import { injectIntl, intlShape, FormattedMessage} from 'react-intl';
import messages from './messages'
import localStorage from 'localStorage'

const confirm = Modal.confirm
const Option = Select.Option;

import PageHeaderLayout from '../../layouts/PageHeaderLayout';

import styles from './index.less';

@connect(state => ({
  chain: state.chain,
  fabric: state.fabric
}))
class Chain extends PureComponent {
  state = {
    loading: true,
    editModalVisible: false,
    editing: false
  }
  componentDidMount() {
    this.props.dispatch({
      type: 'chain/queryChains'
    }).then(() => this.setState({
      loading: false
    }))
  }

  componentWillUnmount() {
  }

  showEditModal = () => {
    const {dispatch} = this.props;
    dispatch({
      type: 'chain/showEditModal'
    })
  }

  showReleaseConfirm = () => {
    const {chain: {currentChain}, intl, dispatch} = this.props;
    const chainId = currentChain ? currentChain.id || "" : ""
    const chainName = currentChain ? currentChain.name || "" : ""
    const title = intl.formatMessage(messages.modal.confirm.release.title, {name: currentChain && currentChain.name || ""})
    confirm({
      title,
      onOk() {
        dispatch({
          type: 'chain/releaseChain',
          payload: {
            id: chainId,
            name: chainName
          }
        })
      },
      onCancel() {},
      okText: intl.formatMessage(messages.button.confirm),
      cancelText: intl.formatMessage(messages.button.cancel)
    });
  }
  applyNewChain = () => {
    const {dispatch} = this.props;
    dispatch(routerRedux.push("/chain/new"))
  }

  changeChain = (chainId) => {
    const {dispatch} = this.props;
    dispatch({
      type: 'chain/changeChainId',
      payload: {
        currentChainId: chainId
      }
    })
  }

  render() {
    const {dispatch, chain: {chains, currentChain, currentChainId, editModalVisible, editing, chainLimit},
      fabric: {channelHeight, queryingChannelHeight}, intl} = this.props;
    const {loading} = this.state;

    const emptyViewProps = {
      onClickButton() {
        dispatch(routerRedux.push('/chain/new'));
      }
    }
    const chainViewProps = {
      chain: currentChain,
      onRelease (data) {
        dispatch({
          type: 'chain/releaseChain',
          payload: data
        })
      },
      onUpdate () {
        dispatch({
          type: 'chain/editModalVisible'
        })
      },
      currentChain,
      channelHeight
    }
    const editModalProps = {
      visible: editModalVisible,
      name: currentChain ? currentChain.name : "",
      loading: editing,
      onCancel () {
        dispatch({
          type: 'chain/hideEditModal'
        })
      },
      onOk (data) {
        dispatch({
          type: 'chain/editChain',
          payload: {
            id: currentChain ? currentChain.id : "",
            ...data
          }
        })
      },
    }

    const pageHeaderContent = chains && chains.length ? (
      <div className={styles.pageHeaderContent}>
        <div className={styles.content}>
          <p className={styles.contentTitle}>
            {chains.length < chainLimit &&
            <Button onClick={this.applyNewChain} size="small" type="primary" style={{marginRight: 5}}>New Chain</Button>
            }
            {chains.length > 1 &&
            <Select size="small" onChange={this.changeChain} value={currentChainId} style={{marginRight: 5}}>
              {chains.map((chainItem, i) =>
                <Option value={chainItem.dbId}>
                  {chainItem.name}
                </Option>
              )}
            </Select>
            }
            {currentChain && currentChain.name || ""}
          </p>
          <p>
            <FormattedMessage {...messages.pageHeader.content.title.createTime} />: {currentChain && currentChain.createTime || ""} &nbsp;&nbsp;
          </p>
          <p style={{marginTop: 5}}>
            <Button size="small" onClick={this.showEditModal} ghost className={styles.ghostBtn} style={{marginRight: 10}}><FormattedMessage {...messages.pageHeader.content.button.changeName} /></Button>
            <Button size="small" onClick={this.showReleaseConfirm} ghost type="danger"><FormattedMessage {...messages.pageHeader.content.button.release} /></Button>
          </p>
        </div>
      </div>
    ) : "";

    const chainStatus = currentChain ? currentChain.status || "error" : "error"
    function statusBadge (status) {
      switch (status) {
        case "running":
          return "success"
        case "initializing":
          return "processing"
        case "releasing":
          return "processing"
        case "error":
        default:
          return "error"
      }
    }
    const pageHeaderExtra = chains && chains.length ? (
      <div className={styles.pageHeaderExtra}>
        <div>
          <p><FormattedMessage {...messages.pageHeader.extra.title.status} /></p>
          <p>
            <span className={styles.firstUpper}><Badge status={statusBadge(chainStatus)} text={intl.formatMessage(messages.pageHeader.extra.content.status[chainStatus])} /></span>
          </p>
        </div>
        <div>
          <p><FormattedMessage {...messages.pageHeader.extra.title.type} /></p>
          <p className={styles.firstUpper}>
            {currentChain && currentChain.type || ""}
          </p>
        </div>
        <div>
          <p><FormattedMessage {...messages.pageHeader.extra.title.running} /></p>
          <p>{currentChain && currentChain.runningHours || 0}</p>
        </div>
      </div>
    ) : "";

    return (
      <PageHeaderLayout
        content={pageHeaderContent}
        extraContent={pageHeaderExtra}
      >
        {chains && chains.length ?
          <ChainView {...chainViewProps}/> :
          <Card
            loading={loading}
            bordered={false}
            bodyStyle={{ padding: 0 }}
          >
            <EmptyView {...emptyViewProps}/>
          </Card>
        }
        {editModalVisible && <EditModal {...editModalProps}/>}
      </PageHeaderLayout>
    );
  }
}

export default injectIntl(Chain)
