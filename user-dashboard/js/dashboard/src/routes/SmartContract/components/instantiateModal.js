/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, {PropTypes} from 'react'
import { Modal, Form, Row, Col, Input, Select, Tag, Tooltip, Button } from 'antd'
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
class InstantiateModal extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      parameters: [],
      inputVisible: false,
      inputValue: '',
      refreshedTag: false
    }
  }
  handleClose = (removedIndex) => {
    let {parameters} = this.state;
    parameters.splice(removedIndex, 1);
    this.setState({
      parameters,
      refreshedTag: true
    }, function () {
      this.setState({
        refreshedTag: false
      })
    });
  }
  handleInputConfirm = () => {
    const state = this.state;
    const inputValue = state.inputValue;
    let parameters = state.parameters;
    if (inputValue) {
      parameters = [...parameters, inputValue];
    }
    this.setState({
      refreshedTag: true
    }, function () {
      this.setState({
        parameters,
        inputVisible: false,
        inputValue: '',
        refreshedTag: false
      });
    })
  }

  showInput = () => {
    this.setState({ inputVisible: true });
  }

  handleInputChange = (e) => {
    this.setState({ inputValue: e.target.value });
  }

  saveInputRef = input => {
    this.paramInput = input
    if (this.paramInput) {
      this.paramInput.focus()
    }
  }

  onOk = (e) => {
    const {form: {validateFields, setFields}, onOk, intl} = this.props
    const {parameters} = this.state;
    e.preventDefault()
    validateFields((errors, values) => {
      if (parameters.length === 0) {
        setFields({
          parameter: {
            value: parameters,
            errors: [new Error(intl.formatMessage(messages.form.validate.required.parameter))]
          },
        });
        return
      }
      if (errors) {
        return
      }
      values["parameter"] = parameters
      onOk(values)
    })
  }
  render () {
    const {onCancel, visible, loading, chains, form: {getFieldDecorator}, intl} = this.props;
    const {parameters, inputVisible, inputValue, refreshedTag} = this.state;
    const title = intl.formatMessage(messages.form.title.instantiateChainCode)
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
    function handleChange(value) {
      console.log(`selected ${value}`);
    }
    const parameterTags = parameters.map((parameter, index) => {
      const isLongTag = parameter.length > 10;
      const tagElem = (
        <Tag key={parameter} closable={true} afterClose={() => this.handleClose(index)}>
          {isLongTag ? `${parameter.slice(0, 20)}...` : parameter}
        </Tag>
      );
      return isLongTag ? <Tooltip title={parameter} key={parameter}>{tagElem}</Tooltip> : tagElem;
    })
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
              <Select placeholder="Select a chain to install">
                {chainOptions}
              </Select>
            )}
          </FormItem>
          <FormItem label="Parameter" {...formItemLayout}>
            {getFieldDecorator('parameter', {
              rules: [
                {
                  required: true,
                  message: intl.formatMessage(messages.form.validate.chain.required),
                }
              ],
            })(
              <span>
              {!refreshedTag && parameterTags}
                {inputVisible && (
                  <Input
                    ref={this.saveInputRef}
                    type="text"
                    size="small"
                    style={{ width: 78 }}
                    value={inputValue}
                    onChange={this.handleInputChange}
                    onBlur={this.handleInputConfirm}
                    onPressEnter={this.handleInputConfirm}
                  />
                )}
                {!inputVisible && <Button size="small" type="dashed" onClick={this.showInput}>+ <FormattedMessage {...messages.button.newParam} /></Button>}
              </span>
            )}
          </FormItem>
        </Form>
      </Modal>
    )
  }
}

export default injectIntl(InstantiateModal)
