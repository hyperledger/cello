/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { Component } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
} from 'antd';
import styles from './index.less';

const FormItem = Form.Item;

@Form.create()
export default class OperateDeploy extends Component {
  state = {
  };
  shouldComponentUpdate(nextProps) {
    if (this.props.operation !== nextProps.operation) {
      this.props.form.resetFields(['functionName', 'args']);
    }
    return true;
  }
  handleSubmit = e => {
    const { onSubmit, operation } = this.props;
    e.preventDefault();
    this.props.form.validateFieldsAndScroll({ force: true }, (err, values) => {
      if (!err) {
        onSubmit({
          ...values,
          operation,
        });
      }
    });
  };
  render() {
    const { form: { getFieldDecorator }, operation, submitting, result, currentDeploy } = this.props;
    const smartContract = currentDeploy.smartContract || {};
    const defaultValues = smartContract.default || {};
    const parameters = defaultValues.parameters || {};
    const functions = defaultValues.functions || {};
    const functionName = operation === "query" ? functions.query || "" : functions.invoke || "";
    const parameter = operation === "query" ? parameters.query || [] : parameters.invoke || [];
    const parameterStr = parameter.join(",");
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 10 },
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
          offset: 10,
        },
      },
    };
    return (
      <Card
        className={styles.tabsCard}
        bordered={false}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Card title={<span className={styles["status-text"]}>{operation}</span>} bordered={false}>
              <Form onSubmit={this.handleSubmit}>
                <FormItem
                  {...formItemLayout}
                  label="Function Name"
                >
                  {getFieldDecorator('functionName', {
                  initialValue: functionName,
                  rules: [
                    {
                      required: true,
                      message: 'Must input function name',
                    },
                  ],
                })(<Input placeholder="Function" />)}
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label="Arguments"
                  extra="Must use ',' separate arguments."
                >
                  {getFieldDecorator('args', {
                  initialValue: parameterStr,
                  rules: [
                    {
                      required: true,
                      message: 'Must input arguments',
                    },
                  ],
                })(<Input placeholder="Arguments" />)}
                </FormItem>
                <FormItem {...tailFormItemLayout}>
                  <Button loading={submitting} type="primary" htmlType="submit"><span className={styles["status-text"]}>{operation}</span></Button>
                </FormItem>
              </Form>
            </Card>
          </Col>
          {operation === 'query' && (
          <Col span={12}>
            <Card title="Query Result" bordered={false} loading={submitting}>
              {result}
            </Card>
          </Col>
)}
        </Row>
      </Card>
    );
  }
}
