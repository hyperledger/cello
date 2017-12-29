/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, {PropTypes} from 'react'
import { Modal, Form, Row, Col, Input } from 'antd'
const FormItem = Form.Item
import {isAscii, isByteLength} from 'validator';
import { injectIntl, intlShape, FormattedMessage} from 'react-intl';
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
class EditModal extends React.Component {
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
  validateName = (rule, value, callback) => {
    const {intl} = this.props;
    if (value) {
      if (!isByteLength(value, {max: 30})) {
        callback(intl.formatMessage(messages.form.validate.name.invalidLength))
      }
    }
    callback()
  }
  render () {
    const {onCancel, visible, loading, name, form: {getFieldDecorator}, intl} = this.props;
    const title = intl.formatMessage(messages.form.title.updateChainCode)
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
    return (
      <Modal {...modalProps}>
        <Form layout="horizontal">
          <FormItem label={intl.formatMessage(messages.form.label.name)} hasFeedback {...formItemLayout}>
            {getFieldDecorator('name', {
              initialValue: name,
              rules: [
                {
                  required: true,
                  message: intl.formatMessage(messages.form.validate.name.required),
                },
                {
                  validator: this.validateName
                }
              ],
            })(<Input />)}
          </FormItem>
        </Form>
      </Modal>
    )
  }
}

export default injectIntl(EditModal)
