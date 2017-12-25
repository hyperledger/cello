/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import {
  Form, Input, Select, Button, Card, Icon, Tooltip,
  Row, Col
} from 'antd';
import { injectIntl, intlShape, FormattedMessage} from 'react-intl';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import {isAscii, isByteLength} from 'validator';
import classNames from 'classnames/bind';
import styles from './style.less';
import messages from './messages'

let cx = classNames.bind(styles);

const FormItem = Form.Item;
const { Option } = Select;

@connect(state => ({
  chain: state.chain,
}))
@Form.create()
class NewChain extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      selectedConfigId: 0,
      selectedConfig: null,
      chainType: '',
      configs: [
        {
          id: 1,
          type: "fabric",
          configName: "Fabric",
          configType: 'basic',
          config: {
            size: 1,
            org: 1,
            peer: 1
          }
        },
        {
          id: 2,
          type: "fabric",
          configName: "Fabric",
          configType: 'advance',
          config: {
            size: 4,
            org: 2,
            peer: 4
          }
        },
        {
          id: 3,
          type: "ink",
          configName: "InkChain",
          configType: 'basic',
          config: {
            size: 1,
            org: 1,
            peer: 2
          }
        },
        {
          id: 4,
          type: "ink",
          configName: "InkChain",
          configType: 'advance',
          config: {
            size: 4,
            org: 2,
            peer: 4
          }
        }
      ]
    }
  }
  handleSubmit = (e) => {
    const {selectedConfig} = this.state;
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (err) {
        const errorLen = Object.keys(err)
        if (errorLen>1) {
          return
        } else {
          if (!("configId" in err) || ("configId" in err && values.configId === 0)) {
            return
          }
        }
      }
      this.props.dispatch({
        type: 'chain/applyChain',
        payload: {
          ...values,
          ...selectedConfig
        },
      });
    });
  }
  configIdValue = (value, prevValue = []) => {
    return this.state.selectedConfigId;
  }
  validateName = (rule, value, callback) => {
    const {intl} = this.props;

    const invalidName = intl.formatMessage(messages.form.validate.name.invalidName)
    const invalidLength = intl.formatMessage(messages.form.validate.name.invalidLength)
    if (value) {
      if (!isAscii(value)) {
        callback(invalidName)
      } else {
        if (!isByteLength(value, {max: 20})) {
          callback(invalidLength)
        }
      }
    }
    callback()
  }
  validateConfig = (rule, value, callback) => {
    const {intl} = this.props;
    if (value === 0) {
      callback(intl.formatMessage(messages.form.validate.configuration.required))
    }
    callback()
  }
  onTypeChange = (value) => {
    this.setState({
      chainType: value,
      selectedConfig: null,
      selectedConfigId: 0
    })
  }
  setSelectedConfig = (config) => {
    this.setState({
      selectedConfig: config,
      selectedConfigId: config.id
    })
  }
  clickCancel = () => {
    const {dispatch} = this.props;
    dispatch(routerRedux.push('/chain'))
  }
  render() {
    const { submitting, intl } = this.props;
    const {configs, chainType, selectedConfigId, selectedConfig} = this.state
    const { getFieldDecorator, getFieldValue } = this.props.form;

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

    const title = intl.formatMessage(messages.title)
    const config = configs.filter(item => item.type === chainType)
    const configCards = config.map((item, i) =>
      <Col span={24}>
        <Card onClick={() => this.setSelectedConfig(item)} className={cx({configCard: true, selected: item.id === selectedConfigId})} bordered={true}>
          <h3 className={styles.cardTitle}>{intl.formatMessage(messages.configuration[item.configType].title, {type: item.configName})}</h3>
          <p className={styles.cardContent}>{intl.formatMessage(messages.configuration[item.configType].content, {type: item.configName})}</p>
        </Card>
      </Col>
    )
    return (
      <PageHeaderLayout title={title}>
        <Card bordered={false}>
          <Form
            onSubmit={this.handleSubmit}
            hideRequiredMark
            style={{ marginTop: 8 }}
          >
            <FormItem label={intl.formatMessage(messages.form.label.name)} {...formItemLayout}>
              {getFieldDecorator('name', {
                initialValue: '',
                rules: [
                  {
                    required: true,
                    message: intl.formatMessage(messages.form.validate.name.invalidName),
                  },
                  {
                    validator: this.validateName
                  }
                ],
              })(<Input />)}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label={intl.formatMessage(messages.form.label.chainType)}
              hasFeedback
            >
              {getFieldDecorator('type', {
                rules: [
                  { required: true, message: intl.formatMessage(messages.form.validate.chainType.required) },
                ],
              })(
                <Select onChange={this.onTypeChange} placeholder={intl.formatMessage(messages.form.placeholder.chainType)}>
                  <Option value="fabric">Fabric</Option>
                  <Option value="ink">InkChain</Option>
                </Select>
              )}
            </FormItem>
            <FormItem label={intl.formatMessage(messages.form.label.configuration)} {...formItemLayout}>
              {getFieldDecorator('configId', {
                validateTrigger: ['onBlur', 'onValidate'],
                trigger: 'onBlur',
                normalize: this.configIdValue,
                rules: [
                  {
                    required: true,
                    message: intl.formatMessage(messages.form.validate.configuration.required),
                  },
                  {
                    validator: this.validateConfig
                  }
                ]
              })(
                <Row gutter={24}>
                  {configCards}
                </Row>
              )}
            </FormItem>
            <FormItem {...submitFormLayout} style={{ marginTop: 32 }}>
              <Button type="primary" htmlType="submit">
                <FormattedMessage {...messages.button.submit} />
              </Button>
              <Button onClick={this.clickCancel} style={{ marginLeft: 8 }}>
                <FormattedMessage {...messages.button.cancel} />
              </Button>
            </FormItem>
          </Form>
        </Card>
      </PageHeaderLayout>
    );
  }
}

export default injectIntl(NewChain)
