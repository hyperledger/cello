/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent } from 'react';
import { Card, Form, Input, Button, Select } from 'antd';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';

const FormItem = Form.Item;
const { Option } = Select;

@connect(({ chain }) => ({
  chain,
}))
@Form.create()
class ApplyChain extends PureComponent {
  static contextTypes = {
    routes: PropTypes.array,
    params: PropTypes.object,
    location: PropTypes.object,
  };
  state = {
    submitting: false,
  }
  submitCallback = () => {
    this.setState({
      submitting: false,
    });
  };
  clickCancel = () => {
    this.props.dispatch(
      routerRedux.push({
        pathname: '/chain',
      })
    );
  };
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        this.props.dispatch({
          type: 'chain/apply',
          payload: {
            ...values,
            callback: this.submitCallback,
          },
        })
      }
    });
  }
  render() {
    const { getFieldDecorator } = this.props.form;
    const { submitting } = this.state;
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

    const networkTypes = ['fabric-1.0', 'fabric-1.2'];
    const networkTypeOptions = networkTypes.map(networkType => (
      <Option value={networkType}>{networkType}</Option>
    ));
    const chainSizes = [4];
    const chainSizeOptions = chainSizes.map(chainSize => (
      <Option value={chainSize}>{chainSize}</Option>
    ));
    return (
      <PageHeaderLayout
        title="Apply New Chain"
        content="Apply a chain here."
      >
        <Card bordered={false}>
          <Form onSubmit={this.handleSubmit} hideRequiredMark style={{ marginTop: 8 }}>
            <FormItem {...formItemLayout} label="Name">
              {getFieldDecorator('name', {
                initialValue: '',
                rules: [
                  {
                    required: true,
                    message: 'Must input name',
                  },
                ],
              })(<Input placeholder="Name" />)}
            </FormItem>
            <FormItem {...formItemLayout} label="Network Type">
              {getFieldDecorator('type', {
                initialValue: networkTypes[0],
                rules: [
                  {
                    required: true,
                    message: 'Must select network type',
                  },
                ],
              })(<Select>{networkTypeOptions}</Select>)}
            </FormItem>
            <FormItem {...formItemLayout} label="Size">
              {getFieldDecorator('size', {
                initialValue: chainSizes[0],
                rules: [
                  {
                    required: true,
                    message: 'Must select chain size',
                  },
                ],
              })(<Select>{chainSizeOptions}</Select>)}
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

export default injectIntl(ApplyChain);
