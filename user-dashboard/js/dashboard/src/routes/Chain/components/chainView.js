/*
 SPDX-License-Identifier: Apache-2.0
*/
import React from 'react'
import PropTypes from 'prop-types'
import { Row, Col, Icon, Button, Modal, Badge } from 'antd'
import Overview from './overview'
import styles from './chainView.less'

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
    const {chain, currentChain, onUpdate, channelHeight} = this.props;
    const overviewProps = {
      chain,
      channelHeight
    }
    const chainStatus = chain ? chain.status || "" : ""
    return (
      <div>
        <Overview {...overviewProps}/>
      </div>
    )
  }
}

export default ChainView
