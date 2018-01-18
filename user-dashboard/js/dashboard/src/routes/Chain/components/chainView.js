/*
 SPDX-License-Identifier: Apache-2.0
*/
import React from 'react'
import PropTypes from 'prop-types'
import { Row, Col, Icon, Button, Modal, Badge } from 'antd'
import Overview from './overview'
import styles from './chainView.less'
import NewsBlock from './newsBlock'
import NewsTrading from './newsTrading'

const confirm = Modal.confirm;

class ChainView extends React.Component {
  constructor (props) {
    super(props)
  }
  showReleaseConfirm = () => {
    const {chain, onRelease} = this.props;
    const chainId = chain ? chain.id || "" : ""
    const chainName = chain ? chain.name || "" : ""
    confirm({
      title: `Do you want to release chain ${chain && chain.name || ""}?`,
      content: <span style={{color: 'red'}}>This operation can not be resumed!</span>,
      onOk() {
        onRelease({
          id: chainId,
          name: chainName
        })
      },
      onCancel() {},
      okText: 'Ok',
      cancelText: 'Cancel'
    });
  }
  render() {
    const {chain, currentChain, onUpdate, loadingCurrentBlockTxList, currentBlockTxList,
      channelHeight, dispatch} = this.props;
    const chainId = window.localStorage.getItem(`${window.apikey}-chainId`)
    const overviewProps = {
      chain,
      channelHeight
    }
    const chainStatus = chain ? chain.status || "" : ""
    const blockProps = {
      onClickBlockHash: function (blockItem) {
        dispatch({
          type: 'chain/showBlockInfoModal'
        })
        dispatch({
          type: 'chain/queryByBlockId',
          payload: {
            id : blockItem.id,
            chainId
          }
        })
      }
    }
    const transactionProps = {
      onClickTx: function (txItem) {
        console.log(txItem, chainId)
        dispatch({
          type: 'chain/showTxInfoModal'
        })
        dispatch({
          type: 'chain/queryByTransactionId',
          payload: {
            id: txItem.id,
            chainId
          }
        })
      }
    }

    return (
      <div>
        <Overview {...overviewProps}/>
        <div style={{paddingRight: 40}}>
          <Row gutter={24} style={{marginTop: 20}}>
            <Col span={12}>
              <NewsBlock {...blockProps} />
            </Col>
            <Col span={12}>
              <NewsTrading {...transactionProps} />
            </Col>
          </Row>
        </div>
      </div>
    )
  }
}

export default ChainView
