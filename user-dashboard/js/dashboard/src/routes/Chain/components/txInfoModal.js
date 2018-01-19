/*
 SPDX-License-Identifier: Apache-2.0
 */
import React, {PropTypes} from 'react'
import { Modal, Row, Col, Input, Timeline, Tag, Spin } from 'antd'
import {isAscii, isByteLength} from 'validator';
import { injectIntl, intlShape, FormattedMessage} from 'react-intl';

const statusCode = {
  0: "VALID",
  100: "TRANSFER_CONFLICT"
}

class TxInfoModal extends React.Component {
  constructor (props) {
    super(props)
  }
  render () {
    const {onCancel, visible, loading, title, intl, currentTxInfo, loadingCurrentTxInfo} = this.props;
    const okText = 'ok'
    const cancelText = 'cancel'
    const modalProps = {
      title,
      visible,
      onOk: onCancel,
      onCancel,
      confirmLoading: loading,
      okText,
      cancelText,
      style: { top: 50 }
    }
    const {name, args, type, validationCode} = currentTxInfo;
    const argsTag = args ? args.map((txArg, i) =>
      <Tag>
        {txArg.replace(/\s/g, '')}
      </Tag>
    ): ""
    return (
      <Modal {...modalProps}>
        {
          loadingCurrentTxInfo ?
            <Spin /> :
            <div>
              <p>Type: {type}</p>
              <p>Status: {statusCode[validationCode] ? statusCode[validationCode] : "INVALID_OTHER_REASON"}</p>
            </div>}
      </Modal>
    )
  }
}

export default injectIntl(TxInfoModal)
