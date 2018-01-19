/*
 SPDX-License-Identifier: Apache-2.0
 */
import React, {PropTypes} from 'react'
import { Modal, Row, Col, Input, Timeline, Spin, Tooltip } from 'antd'
import {isAscii, isByteLength} from 'validator';
import { injectIntl, intlShape, FormattedMessage} from 'react-intl';
import moment from 'moment'
import styles from './blockInfoModal.less'

class BlockInfoModal extends React.Component {
  constructor (props) {
    super(props)
  }
  render () {
    const {onCancel, visible, loading, title, intl, currentBlockTxList, onClickTx, loadingCurrentBlockTxList} = this.props;
    const okText = 'Ok'
    const cancelText = 'Cancel'
    const modalProps = {
      title,
      visible,
      onOk: onCancel,
      onCancel,
      confirmLoading: loading,
      okText,
      cancelText,
      width:600,
      style: { top: 50 }
    }
    const txTimeLineItems = currentBlockTxList.map((txItem, i) =>
      <Timeline.Item>
        <p>
          txId:
          {/*<Tooltip overlayClassName={styles.tooltipOverlay} placement="bottomLeft" title={txItem.id}>*/}
            <a onClick={() => onClickTx(txItem.id)}>
              {txItem.id}
            </a>
          {/*</Tooltip>*/}
        </p>
        <p>
          timestamp: {moment.unix(txItem.timestamp).format("YYYY-MM-DD HH:mm:ss")}
        </p>
      </Timeline.Item>
    )
    return (
      <Modal  {...modalProps} >
        {loadingCurrentBlockTxList ? <Spin /> : <span>
                 <Timeline>
                   {txTimeLineItems}
                 </Timeline>
               </span>}
      </Modal>
    )
  }
}

export default injectIntl(BlockInfoModal)
