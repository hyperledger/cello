/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent } from 'react';
import { Card, Form, Input, Button, Select, InputNumber, Switch, Tooltip, Icon } from 'antd';
import isIP from 'validator/lib/isIP';
import isNumeric from 'validator/lib/isNumeric';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import styles from './index.less';

const FormItem = Form.Item;
const { Option } = Select;

const messages = defineMessages({
  label: {
    name: {
      id: 'Host.Create.Validate.Label.Name',
      defaultMessage: 'Name',
    },
    daemonUrl: {
      id: 'Host.Create.Validate.Label.DaemonUrl',
      defaultMessage: 'Daemon Url',
    },
    capacity: {
      id: 'Host.Create.Validate.Label.Capacity',
      defaultMessage: 'Capacity',
    },
    hostType: {
      id: 'Host.Create.Validate.Label.HostType',
      defaultMessage: 'Host Type',
    },
    logLevel: {
      id: 'Host.Create.Validate.Label.LogLevel',
      defaultMessage: 'Log Level',
    },
    logType: {
      id: 'Host.Create.Validate.Label.LogType',
      defaultMessage: 'Log Type',
    },
    schedulable: {
      id: 'Host.Create.Validate.Label.Schedulable',
      defaultMessage: 'Schedulable',
    },
    filled: {
      id: 'Host.Create.Validate.Label.Filled',
      defaultMessage: 'Auto Filled',
    },
  },
  button: {
    submit: {
      id: 'Host.Create.Button.Submit',
      defaultMessage: 'Submit',
    },
    cancel: {
      id: 'Host.Create.Button.Cancel',
      defaultMessage: 'Cancel',
    },
  },
  validate: {
    error: {
      workerApi: {
        id: 'Host.Create.Validate.Error.WorkerApi',
        defaultMessage: 'Please input validate worker api.',
      },
    },
    required: {
      name: {
        id: 'Host.Create.Validate.Required.Name',
        defaultMessage: 'Please input name.',
      },
      daemonUrl: {
        id: 'Host.Create.Validate.Required.DaemonUrl',
        defaultMessage: 'Please input daemon url.',
      },
      capacity: {
        id: 'Host.Create.Validate.Required.Capacity',
        defaultMessage: 'Please input capacity.',
      },
      hostType: {
        id: 'Host.Create.Validate.Required.HostType',
        defaultMessage: 'Please select a host type.',
      },
      logType: {
        id: 'Host.Create.Validate.Required.LogType',
        defaultMessage: 'Please select a log type.',
      },
      logLevel: {
        id: 'Host.Create.Validate.Required.LogLevel',
        defaultMessage: 'Please select a log level.',
      },
    },
  },
});

@connect(({ host, loading }) => ({
  host,
  creatingHost: loading.effects['host/createHost'],
}))
@Form.create()
class CreateHost extends PureComponent {
  state = {
    schedulable: true,
    autofill: false,
    submitting: false,
  };
  changeSchedulable = checked => {
    this.setState({
      schedulable: checked,
    });
  };
  changeFilled = checked => {
    this.setState({
      autofill: checked,
    });
  };
  clickCancel = () => {
    this.props.dispatch(
      routerRedux.push({
        pathname: '/host',
      })
    );
  };
  validateWorkerApi = (rule, value, callback) => {
    const { intl } = this.props;
    if (value) {
      if (value.indexOf(':') < 0) {
        callback(intl.formatMessage(messages.validate.error.workerApi));
      } else {
        const [ip, port] = value.split(':');
        if (!isIP(ip) || !isNumeric(port)) {
          callback(intl.formatMessage(messages.validate.error.workerApi));
        } else if (parseInt(port, 10) < 0 || parseInt(port, 10) > 65535) {
          callback(intl.formatMessage(messages.validate.error.workerApi));
        } else {
          callback();
        }
      }
    } else {
      callback();
    }
  };
  submitCallback = () => {
    this.setState({
      submitting: false,
    });
  };
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        const { schedulable, autofill } = this.state;
        this.setState({
          submitting: true,
        });
        this.props.dispatch({
          type: 'host/createHost',
          payload: {
            ...values,
            schedulable: schedulable ? 'on' : 'off',
            autofill: autofill ? 'on' : 'off',
            callback: this.submitCallback,
          },
        });
      }
    });
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const { schedulable, autofill, submitting } = this.state;
    const { intl } = this.props;

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
    const hostTypeValues = ['docker', 'swarm', 'kubernetes', 'vsphere'];
    const hostTypeOptions = hostTypeValues.map(item => (
      <Option value={item}>
        <span className={styles.upperText}>{item}</span>
      </Option>
    ));
    const logLevelValues = ['debug', 'info', 'notice', 'warning', 'critical'];
    const logLevelOptions = logLevelValues.map(item => (
      <Option value={item}>
        <span className={styles.upperText}>{item}</span>
      </Option>
    ));
    const logTypeValues = ['local'];
    const logTypeOptions = logTypeValues.map(item => (
      <Option value={item}>
        <span className={styles.upperText}>{item}</span>
      </Option>
    ));
    return (
      <PageHeaderLayout
        title="Create New Host"
        content="Here you can create multiple type host, for creating fabric cluster."
      >
        <Card bordered={false}>
          <Form onSubmit={this.handleSubmit} hideRequiredMark style={{ marginTop: 8 }}>
            <FormItem {...formItemLayout} label={intl.formatMessage(messages.label.name)}>
              {getFieldDecorator('name', {
                rules: [
                  {
                    required: true,
                    message: intl.formatMessage(messages.validate.required.name),
                  },
                ],
              })(<Input placeholder={intl.formatMessage(messages.label.name)} />)}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label={
                <span>
                  <FormattedMessage {...messages.label.daemonUrl} />
                  <em className={styles.optional}>
                    <Tooltip title="Inputh host daemon url with port number: 192.168.0.1:2375">
                      <Icon type="info-circle-o" style={{ marginRight: 4 }} />
                    </Tooltip>
                  </em>
                </span>
              }
            >
              {getFieldDecorator('worker_api', {
                rules: [
                  {
                    required: true,
                    message: intl.formatMessage(messages.validate.required.daemonUrl),
                  },
                  {
                    validator: this.validateWorkerApi,
                  },
                ],
              })(<Input addonBefore="tcp://" placeholder="192.168.0.1:2375" />)}
            </FormItem>
            <FormItem {...formItemLayout} label={intl.formatMessage(messages.label.capacity)}>
              {getFieldDecorator('capacity', {
                initialValue: 1,
                rules: [
                  {
                    required: true,
                    message: intl.formatMessage(messages.validate.required.capacity),
                  },
                ],
              })(
                <InputNumber
                  width={200}
                  placeholder={intl.formatMessage(messages.label.capacity)}
                  min={1}
                  max={100}
                />
              )}
            </FormItem>
            <FormItem {...formItemLayout} label={intl.formatMessage(messages.label.hostType)}>
              {getFieldDecorator('host_type', {
                initialValue: hostTypeValues[0],
                rules: [
                  {
                    required: true,
                    message: intl.formatMessage(messages.validate.required.hostType),
                  },
                ],
              })(<Select>{hostTypeOptions}</Select>)}
            </FormItem>
            <FormItem {...formItemLayout} label={intl.formatMessage(messages.label.logLevel)}>
              {getFieldDecorator('log_level', {
                initialValue: logLevelValues[0],
                rules: [
                  {
                    required: true,
                    message: intl.formatMessage(messages.validate.required.logLevel),
                  },
                ],
              })(<Select>{logLevelOptions}</Select>)}
            </FormItem>
            <FormItem {...formItemLayout} label={intl.formatMessage(messages.label.logType)}>
              {getFieldDecorator('log_type', {
                initialValue: logTypeValues[0],
                rules: [
                  {
                    required: true,
                    message: intl.formatMessage(messages.validate.required.logType),
                  },
                ],
              })(<Select>{logTypeOptions}</Select>)}
            </FormItem>
            <FormItem {...formItemLayout} label={intl.formatMessage(messages.label.schedulable)}>
              {getFieldDecorator('schedulable', {})(
                <Switch checked={schedulable} onChange={this.changeSchedulable} />
              )}
            </FormItem>
            <FormItem {...formItemLayout} label={intl.formatMessage(messages.label.filled)}>
              {getFieldDecorator('autofill', {})(
                <Switch checked={autofill} onChange={this.changeFilled} />
              )}
            </FormItem>
            <FormItem {...submitFormLayout} style={{ marginTop: 32 }}>
              <Button loading={submitting} type="primary" htmlType="submit">
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

export default injectIntl(CreateHost);
