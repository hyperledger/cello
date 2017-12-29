/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, {PropTypes} from 'react'
import { Modal, Form, Row, Col, Input, Select } from 'antd'
const FormItem = Form.Item
import {isAscii, isByteLength} from 'validator';
import { injectIntl, intlShape, FormattedMessage} from 'react-intl';
const Option = Select.Option;
import messages from './messages'

const formItemLayout = {
  labelCol: {
    span: 6,
  },
  wrapperCol: {
    span: 14,
  },
}

@Form.create()
class InstallModal extends React.Component {
  constructor (props) {
    super(props)
  }
  onOk = (e) => {
    const {form: {validateFields}, onOk} = this.props
    e.preventDefault()
    validateFields((errors, values) => {
      if (errors) {
        return
      }
      onOk(values)
    })
  }
  render () {
    const {onCancel, visible, loading, chains, form: {getFieldDecorator}, intl} = this.props;
    const title = intl.formatMessage(messages.form.title.installChainCode)
    const okText = intl.formatMessage(messages.button.submit)
    const cancelText = intl.formatMessage(messages.button.cancel)
    const modalProps = {
      title,
      visible,
      onOk: this.onOk,
      onCancel,
      confirmLoading: loading,
      okText,
      cancelText,
      style: { top: 50 }
    }
    const chainOptions = chains.map((chain, i) =>
      <Option value={chain.id}>{chain.name}</Option>
    )
    return (
      <Modal {...modalProps}>
        <Form layout="horizontal">
          <FormItem label="Chain" hasFeedback {...formItemLayout}>
            {getFieldDecorator('chainId', {
              initialValue: chains.length ? chains[0].id : "",
              rules: [
                {
                  required: true,
                  message: intl.formatMessage(messages.form.validate.chain.required),
                }
              ],
            })(
              <Select placeholder="Select a chain to install" notFoundContent="No available chain">
                {chainOptions}
              </Select>
            )}
          </FormItem>
        </Form>
      </Modal>
    )
  }
}

export default injectIntl(InstallModal)
