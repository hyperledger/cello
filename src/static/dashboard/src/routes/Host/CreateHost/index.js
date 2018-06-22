/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent } from 'react';
import { Card, Form, Input, Button, Select, InputNumber, Switch, Tooltip, Icon } from 'antd';
import isIP from 'validator/lib/isIP';
import isNumeric from 'validator/lib/isNumeric';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import styles from './index.less';

const FormItem = Form.Item;
const { Option } = Select;
const { TextArea } = Input;

const messages = defineMessages({
  updateTitle: {
    id: 'Host.Create.UpdateTitle',
    defaultMessage: 'Update Host',
  },
  title: {
    id: 'Host.Create.Title',
    defaultMessage: 'Create New Host',
  },
  subTitle: {
    id: 'Host.Create.SubTitle',
    defaultMessage: 'Here you can create multiple type host, for creating fabric cluster.',
  },
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
    credentialType: {
      id: 'Host.Create.Validate.Label.CredentialType',
      defaultMessage: 'Credential Type',
    },
    certificateContent: {
      id: 'Host.Create.Validate.Label.CertificateContent',
      defaultMessage: 'Certificate Content',
    },
    certificateKey: {
      id: 'Host.Create.Validate.Label.CertificateKey',
      defaultMessage: 'Certificate Key',
    },
    configurationContent: {
      id: 'Host.Create.Validate.Label.ConfigurationContent',
      defaultMessage: 'Configuration Content',
    },
    username: {
      id: 'Host.Create.Validate.Label.Username',
      defaultMessage: 'Username',
    },
    password: {
      id: 'Host.Create.Validate.Label.Password',
      defaultMessage: 'Password',
    },
    extraParameters: {
      id: 'Host.Create.Validate.Label.ExtraParameters',
      defaultMessage: 'Extra Parameters',
    },
    NFSServer: {
      id: 'Host.Create.Validate.Label.NFSServer',
      defaultMessage: 'NFS Server Address',
    },
    useSSL: {
      id: 'Host.Create.Validate.Label.UseSSL',
      defaultMessage: 'Use SSL Verification',
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
      NFSServer: {
        id: 'Host.Create.Validate.Error.NFSServer',
        defaultMessage: 'Please input validate NFS Server address.',
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
      credentialType: {
        id: 'Host.Create.Validate.Required.CredentialType',
        defaultMessage: 'Please select a credential type.',
      },
      certificateContent: {
        id: 'Host.Create.Validate.Required.CertificateContent',
        defaultMessage: 'Please input certificate content.',
      },
      certificateKey: {
        id: 'Host.Create.Validate.Required.CertificateKey',
        defaultMessage: 'Please input certificate key.',
      },
      configurationContent: {
        id: 'Host.Create.Validate.Required.ConfigurationContent',
        defaultMessage: 'Please input configuration content.',
      },
      username: {
        id: 'Host.Create.Validate.Required.Username',
        defaultMessage: 'Please input username.',
      },
      password: {
        id: 'Host.Create.Validate.Required.Username',
        defaultMessage: 'Please input password.',
      },
      NFSServer: {
        id: 'Host.Create.Validate.Required.NFSServer',
        defaultMessage: 'Please input NFS server address.',
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
  static contextTypes = {
    routes: PropTypes.array,
    params: PropTypes.object,
    location: PropTypes.object,
  };
  constructor(props) {
    super(props);
    const { host } = this.props;
    const location = this.props.location || this.context.location;
    const search = new URLSearchParams(location.search);
    const hostId = search.get('id');
    const action = search.get('action') || 'create';
    const { hosts } = host;
    const filterHosts = hosts.filter(hostItem => hostItem.id === hostId);
    const currentHost = filterHosts.length > 0 ? filterHosts[0] : {};
    const hostTypeValues = ['docker', 'swarm', 'kubernetes', 'vsphere'];
    const k8sCredTypes = [
      {
        id: '1',
        name: 'cert_key',
      },
      {
        id: '2',
        name: 'config',
      },
      {
        id: '0',
        name: 'username_password',
      },
    ];
    this.state = {
      schedulable: action === 'create' ? true : currentHost.schedulable === 'true',
      autofill: action === 'create' ? false : currentHost.autofill === 'true',
      submitting: false,
      hostType: action === 'create' ? hostTypeValues[0] : currentHost.type,
      k8sCredType: action === 'create' ? k8sCredTypes[0].id : currentHost.k8sCredType,
      k8sUseSSL: action === 'create' ? true : currentHost.k8sUseSSL === 'true',
    };
  }
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
  validateNfsServer = (rule, value, callback) => {
    const { intl } = this.props;
    if (value) {
      if (!isIP(value)) {
        callback(intl.formatMessage(messages.validate.error.NFSServer));
      } else {
        callback();
      }
    } else {
      callback();
    }
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
    const location = this.props.location || this.context.location;
    const search = new URLSearchParams(location.search);
    const hostId = search.get('id');
    const action = search.get('action') || 'create';
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        const { schedulable, autofill, k8sUseSSL } = this.state;
        this.setState({
          submitting: true,
        });
        if (action === 'create') {
          this.props.dispatch({
            type: 'host/createHost',
            payload: {
              ...values,
              schedulable: schedulable ? 'on' : 'off',
              autofill: autofill ? 'on' : 'off',
              k8s_ssl: k8sUseSSL ? 'on' : 'off',
              callback: this.submitCallback,
            },
          });
        } else {
          delete values.host_type;
          this.props.dispatch({
            type: 'host/updateHost',
            payload: {
              ...values,
              schedulable: schedulable ? 'true' : 'false',
              autofill: autofill ? 'true' : 'false',
              k8s_ssl: k8sUseSSL ? 'on' : 'off',
              id: hostId,
              callback: this.submitCallback,
            },
          });
        }
      }
    });
  };
  hostTypeChange = value => {
    this.setState({
      hostType: value,
    });
  };
  k8sCredTypeChange = value => {
    this.setState({
      k8sCredType: value,
    });
  };
  k8sUseSSLChange = checked => {
    this.setState({
      k8sUseSSL: checked,
    });
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const { schedulable, autofill, submitting, hostType, k8sCredType, k8sUseSSL } = this.state;
    const { intl, host } = this.props;
    const location = this.props.location || this.context.location;
    const search = new URLSearchParams(location.search);
    const hostId = search.get('id');
    const action = search.get('action') || 'create';
    const { hosts } = host;
    const filterHosts = hosts.filter(hostItem => hostItem.id === hostId);
    const currentHost = filterHosts.length > 0 ? filterHosts[0] : {};

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
    const k8sCredTypes = [
      {
        id: '1',
        name: 'cert_key',
      },
      {
        id: '2',
        name: 'config',
      },
      {
        id: '0',
        name: 'username_password',
      },
    ];
    const k8sCredTypeOptions = k8sCredTypes.map(item => (
      <Option value={item.id}>{item.name}</Option>
    ));
    return (
      <PageHeaderLayout
        title={
          action === 'create'
            ? intl.formatMessage(messages.title)
            : intl.formatMessage(messages.updateTitle)
        }
        content={action === 'create' ? intl.formatMessage(messages.subTitle) : ''}
      >
        <Card bordered={false}>
          <Form onSubmit={this.handleSubmit} hideRequiredMark style={{ marginTop: 8 }}>
            <FormItem {...formItemLayout} label={intl.formatMessage(messages.label.name)}>
              {getFieldDecorator('name', {
                initialValue: action === 'create' ? '' : currentHost.name,
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
                initialValue: action === 'create' ? '' : currentHost.worker_api.split('//')[1],
                rules: [
                  {
                    required: true,
                    message: intl.formatMessage(messages.validate.required.daemonUrl),
                  },
                  {
                    validator: this.validateWorkerApi,
                  },
                ],
              })(<Input disabled={action === 'update'} placeholder="192.168.0.1:2375" />)}
            </FormItem>
            <FormItem {...formItemLayout} label={intl.formatMessage(messages.label.capacity)}>
              {getFieldDecorator('capacity', {
                initialValue: action === 'create' ? 1 : currentHost.capacity,
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
                initialValue: action === 'create' ? hostTypeValues[0] : currentHost.type,
                rules: [
                  {
                    required: true,
                    message: intl.formatMessage(messages.validate.required.hostType),
                  },
                ],
              })(
                <Select onChange={this.hostTypeChange} disabled={action === 'update'}>
                  {hostTypeOptions}
                </Select>
              )}
            </FormItem>
            {hostType === 'kubernetes' && (
              <div>
                <FormItem
                  {...formItemLayout}
                  label={intl.formatMessage(messages.label.credentialType)}
                >
                  {getFieldDecorator('k8s_cred_type', {
                    initialValue: k8sCredType,
                    rules: [
                      {
                        required: true,
                        message: intl.formatMessage(messages.validate.required.credentialType),
                      },
                    ],
                  })(
                    <Select onChange={this.k8sCredTypeChange} disabled={action === 'update'}>
                      {k8sCredTypeOptions}
                    </Select>
                  )}
                </FormItem>
                {k8sCredType === '1' && (
                <div>
                  <FormItem
                    {...formItemLayout}
                    label={intl.formatMessage(messages.label.certificateContent)}
                  >
                    {getFieldDecorator('k8s_cert', {
                      rules: [
                        {
                          required: true,
                          message: intl.formatMessage(
                            messages.validate.required.certificateContent
                          ),
                        },
                      ],
                    })(<TextArea rows={4} placeholder={intl.formatMessage(messages.label.certificateContent)} />)}
                  </FormItem>
                  <FormItem
                    {...formItemLayout}
                    label={intl.formatMessage(messages.label.certificateKey)}
                  >
                    {getFieldDecorator('k8s_key', {
                     rules: [
                       {
                         required: true,
                         message: intl.formatMessage(
                           messages.validate.required.certificateKey
                         ),
                       },
                     ],
                   })(<TextArea rows={4} placeholder={intl.formatMessage(messages.label.certificateKey)} />)}
                  </FormItem>
                </div>
                )}
                {k8sCredType === '2' && (
                  <FormItem
                    {...formItemLayout}
                    label={intl.formatMessage(messages.label.configurationContent)}
                  >
                    {getFieldDecorator('k8s_config', {
                      rules: [
                        {
                          required: true,
                          message: intl.formatMessage(
                            messages.validate.required.configurationContent
                          ),
                        },
                      ],
                    })(<TextArea rows={4} />)}
                  </FormItem>
                )}
                {k8sCredType === '0' && (
                  <div>
                    <FormItem
                      {...formItemLayout}
                      label={intl.formatMessage(messages.label.username)}
                    >
                      {getFieldDecorator('k8s_username', {
                        rules: [
                          {
                            required: true,
                            message: intl.formatMessage(messages.validate.required.username),
                          },
                        ],
                      })(<Input placeholder={intl.formatMessage(messages.label.username)} />)}
                    </FormItem>
                    <FormItem
                      {...formItemLayout}
                      label={intl.formatMessage(messages.label.password)}
                    >
                      {getFieldDecorator('k8s_password', {
                        rules: [
                          {
                            required: true,
                            message: intl.formatMessage(messages.validate.required.password),
                          },
                        ],
                      })(<Input placeholder={intl.formatMessage(messages.label.password)} />)}
                    </FormItem>
                  </div>
                )}
                <FormItem
                  {...formItemLayout}
                  label={intl.formatMessage(messages.label.extraParameters)}
                >
                  {getFieldDecorator('k8s_extra_params', {})(<Input />)}
                </FormItem>
                <FormItem {...formItemLayout} label={intl.formatMessage(messages.label.NFSServer)}>
                  {getFieldDecorator('k8s_nfs_server', {
                    rules: [
                      {
                        required: true,
                        message: intl.formatMessage(messages.validate.required.NFSServer),
                      },
                      {
                        validator: this.validateNfsServer,
                      },
                    ],
                  })(<Input placeholder="192.168.0.1" />)}
                </FormItem>
                <FormItem {...formItemLayout} label={intl.formatMessage(messages.label.useSSL)}>
                  {getFieldDecorator('k8s_ssl', {})(
                    <Switch checked={k8sUseSSL} onChange={this.k8sUseSSLChange} />
                  )}
                </FormItem>
              </div>
            )}
            <FormItem {...formItemLayout} label={intl.formatMessage(messages.label.logLevel)}>
              {getFieldDecorator('log_level', {
                initialValue: action === 'create' ? logLevelValues[0] : currentHost.log_level,
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
                initialValue: action === 'create' ? logTypeValues[0] : currentHost.log_type,
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
