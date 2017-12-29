/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Row, Col, Card, List, Form, Avatar, Tag, Tooltip,
  Select, Button, Radio, Alert, Input } from 'antd';
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
import { injectIntl, intlShape, FormattedMessage} from 'react-intl';
import messages from './messages'
const FormItem = Form.Item
const Option = Select.Option;

import PageHeaderLayout from '../../layouts/PageHeaderLayout';

import styles from './index.less';

const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 },
      },
    };
const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 14,
      offset: 6,
    },
  },
};

@connect(state => ({
  chain: state.chain,
  chainCode: state.chainCode
}))
@Form.create()
class Api extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      parameters: [],
      inputVisible: false,
      inputValue: '',
      refreshedTag: false
    }
  }
  componentDidMount() {
    this.props.dispatch({
      type: 'chainCode/queryChainCodes',
      payload: {
        status: "instantiated"
      }
    })
    this.props.dispatch({
      type: 'chain/listDBChain'
    })
  }

  componentWillUnmount() {
    const {dispatch} = this.props;
    dispatch({
      type: 'chainCode/clear'
    })
  }
  handleSubmit = (e) => {
    const {dispatch, intl} = this.props;
    const {parameters} = this.state;
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (parameters.length === 0) {
        this.props.form.setFields({
          parameter: {
            value: parameters,
            errors: [new Error(intl.formatMessage(messages.form.validate.required.parameter))]
          },
        });
        return
      }
      if (!err) {
        values["parameter"] = parameters
        dispatch({
          type: 'chainCode/callChainCode',
          payload: values
        })
      }
    });
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

  showInput = () => {
    this.setState({ inputVisible: true }, () => this.input.focus());
  }

  handleInputChange = (e) => {
    this.setState({ inputValue: e.target.value });
  }

  handleInputConfirm = () => {
    const state = this.state;
    const _that = this;
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
  saveInputRef = input => this.input = input

  render() {
    const {form: {getFieldDecorator}, intl, chainCode: {chainCodes, calling, callResult}} = this.props;
    const {parameters, inputVisible, inputValue, refreshedTag} = this.state;
    const parameterTags = parameters.map((parameter, index) => {
      const isLongTag = parameter.length > 10;
      const tagElem = (
            <Tag key={parameter} closable={true} afterClose={() => this.handleClose(index)}>
              {isLongTag ? `${parameter.slice(0, 20)}...` : parameter}
            </Tag>
          );
      return isLongTag ? <Tooltip title={parameter} key={parameter}>{tagElem}</Tooltip> : tagElem;
    })
    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <FormattedMessage {...messages.pageHeader.content} />
      </div>
    );

    const pageHeaderExtra = (
      <div className={styles.pageHeaderExtra}>
      </div>
    );
    const chainCodeOptions = chainCodes.map((chainCode, i) =>
      <Option value={chainCode.id}>{chainCode.name}</Option>
    )

    return (
      <PageHeaderLayout
        content={pageHeaderContent}
        extraContent={pageHeaderExtra}
      >
        <Row gutter={24}>
          <Card bordered={false}>
            <Form layout="horizontal" onSubmit={this.handleSubmit}>
              <FormItem label={intl.formatMessage(messages.form.label.smartContract)} hasFeedback {...formItemLayout}>
                {getFieldDecorator('id', {
                  initialValue: chainCodes.length ? chainCodes[0].id : "",
                  rules: [
                    {
                      required: true,
                      message: intl.formatMessage(messages.form.validate.required.chainCode),
                    }
                  ],
                })(
                  <Select placeholder="Select a chain to install">
                    {chainCodeOptions}
                  </Select>
                )}
              </FormItem>
              <FormItem label={intl.formatMessage(messages.form.label.function)} {...formItemLayout}>
                {getFieldDecorator('func', {
                  rules: [
                    {
                      required: true,
                      message: intl.formatMessage(messages.form.validate.required.function),
                    }
                  ],
                })(
                  <Input />
                )}
              </FormItem>
              <FormItem label={intl.formatMessage(messages.form.label.parameter)} {...formItemLayout} extra={intl.formatMessage(messages.form.info.parameter)}>
                {getFieldDecorator('parameter', {
                  rules: [
                    {
                      required: true,
                      message: intl.formatMessage(messages.form.validate.required.parameter),
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
              <FormItem label={intl.formatMessage(messages.form.label.method)} {...formItemLayout}>
                {getFieldDecorator('method', {
                  rules: [
                    {
                      required: true,
                      message: intl.formatMessage(messages.form.validate.required.method),
                    }
                  ],
                })(
                  <RadioGroup defaultValue="invoke">
                    <RadioButton value="invoke"><FormattedMessage {...messages.form.options.method.invoke} /></RadioButton>
                    <RadioButton value="query"><FormattedMessage {...messages.form.options.method.query} /></RadioButton>
                  </RadioGroup>
                )}
              </FormItem>
              {!calling && callResult.message &&
              <FormItem {...tailFormItemLayout}>
                <Alert showIcon message={callResult.message} type={callResult.success ? "success" : "error"} />
              </FormItem>
              }
              <FormItem {...tailFormItemLayout}>
                <Button loading={calling} type="primary" htmlType="submit"><FormattedMessage {...messages.button.call} /></Button>
              </FormItem>
            </Form>
          </Card>
        </Row>
      </PageHeaderLayout>
    );
  }
}

export default injectIntl(Api)
