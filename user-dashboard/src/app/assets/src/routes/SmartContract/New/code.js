/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent } from 'react';
import { Card, Form, Input, Button, Upload, Icon, message } from 'antd';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import pathToRegexp from 'path-to-regexp';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import config from '../../../utils/config';

const FormItem = Form.Item;

@connect(({ smartContract }) => ({
  smartContract,
}))
@Form.create()
class NewSmartContractCode extends PureComponent {
  static contextTypes = {
    routes: PropTypes.array,
    params: PropTypes.object,
    location: PropTypes.object,
  };
  state = {
    submitting: false,
    smartContractId: '',
    smartContractCodeId: '',
  };
  componentDidMount() {
    const { location } = this.props;
    const info = pathToRegexp('/smart-contract/new-code/:id').exec(location.pathname);
    if (info) {
      const id = info[1];
      this.setState({
        smartContractId: id,
      });
    }
  }
  onRemoveFile = () => {
    const { smartContractCodeId } = this.state;
    this.props.dispatch({
      type: 'smartContract/deleteSmartContractCode',
      payload: {
        id: smartContractCodeId,
        callback: this.deleteCallback,
      },
    })
  };
  onUploadFile = info => {
    if (info.file.status === 'done') {
      const { response } = info.file;
      if (response.success) {
        this.setState({
          smartContractCodeId: response.id,
        });
      } else {
        message.error("Upload smart contract file failed");
      }
    } else if (info.file.status === 'error') {
      message.error('Upload smart contract file failed.')
    }
  };
  submitCallback = ({ payload, success }) => {
    const { smartContractId } = this.state;
    this.setState({
      submitting: false,
    });
    if (success) {
      message.success(`Create new smart contract version ${payload.version} successfully.`);
      this.props.dispatch(
        routerRedux.push({
          pathname: `/smart-contract/info/${smartContractId}`,
        })
      );
    } else {
      message.error(`Create new smart contract version ${payload.version} failed.`);
    }
  };
  clickCancel = () => {
    const { smartContractCodeId, smartContractId } = this.state;
    if (smartContractCodeId !== '') {
      this.props.dispatch({
        type: 'smartContract/deleteSmartContractCode',
        payload: {
          id: smartContractCodeId,
        },
      });
    }
    this.props.dispatch(
      routerRedux.push({
        pathname: `/smart-contract/info/${smartContractId}`,
      })
    );
  };
  handleSubmit = e => {
    const { smartContractCodeId } = this.state;
    e.preventDefault();
    this.props.form.validateFieldsAndScroll({ force: true }, (err, values) => {
      if (!err) {
        this.props.dispatch({
          type: 'smartContract/updateSmartContractCode',
          payload: {
            id: smartContractCodeId,
            ...values,
            callback: this.submitCallback,
          },
        })
      }
    });
  };
  normFile = () => {
    return this.state.smartContractCodeId;
  };
  validateUpload = (rule, value, callback) => {
    const { smartContractCodeId } = this.state;
    if (smartContractCodeId === '') {
      callback('Must upload smart contract zip file');
    }
    callback();
  };
  deleteCallback = () => {
    this.setState({
      smartContractCodeId: '',
    });
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const { submitting, smartContractCodeId, smartContractId } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 12 },
        md: { span: 10 },
      },
    };

    const submitFormLayout = {
      wrapperCol: {
        xs: { span: 24, offset: 0 },
        sm: { span: 10, offset: 7 },
      },
    };
    const uploadProps = {
      name: "smart_contract",
      accept: '.zip',
      action: `${config.url.smartContract.upload}?_csrf=${window.csrf}&id=${smartContractId}`,
      onChange: this.onUploadFile,
      onRemove: this.onRemoveFile,
      beforeUpload() {
        return smartContractCodeId === '';
      },
    };

    return (
      <PageHeaderLayout
        title="Upload new version code"
      >
        <Card bordered={false}>
          <Form onSubmit={this.handleSubmit} hideRequiredMark style={{ marginTop: 8 }}>
            <FormItem {...formItemLayout} label="Version">
              {getFieldDecorator('version', {
                initialValue: '',
                rules: [
                  {
                    required: true,
                    message: 'Must input version of smart contract',
                  },
                ],
              })(<Input placeholder="Version" />)}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="Upload"
              extra="only accept .zip file."
            >
              {getFieldDecorator('smartContractCode', {
                getValueFromEvent: this.normFile,
                trigger: 'onBlur',
                rules: [
                  {
                    validator: this.validateUpload,
                  },
                ],
              })(
                <Upload {...uploadProps}>
                  <Button disabled={smartContractCodeId !== ''}>
                    <Icon type="upload" /> Click to upload
                  </Button>
                </Upload>
              )}
            </FormItem>
            <FormItem {...submitFormLayout} style={{ marginTop: 32 }}>
              <Button loading={submitting} type="primary" htmlType="submit">
                Submit
              </Button>
              <Button onClick={this.clickCancel} style={{ marginLeft: 8 }}>
                Cancel
              </Button>
            </FormItem>
          </Form>
        </Card>
      </PageHeaderLayout>
    );
  }
}

export default injectIntl(NewSmartContractCode);
