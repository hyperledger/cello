import React, { PureComponent } from 'react';
import { Card, Form, Input, Button, Select, Switch, Icon, InputNumber, Upload, message } from 'antd';
import { FormattedMessage, formatMessage } from 'umi-plugin-react/locale';
import isIP from 'validator/lib/isIP';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

const FormItem = Form.Item;
const { Option } = Select;

@connect(({ agent, loading }) => ({
  agent,
  submitting: loading.effects['agent/createAgent'],
  updating: loading.effects['agent/updateAgent'],
}))
@Form.create()
class CreateAgent extends PureComponent {
  state = {
    fileList: []
  };

  clickCancel = () => {
    this.props.dispatch(
      routerRedux.push({
        pathname: '/operator/agent',
      })
    );
  };

  componentDidMount() {
    const location = this.props.location || this.context.location;
    const search = new URLSearchParams(location.search);
    const action = search.get('action');
    if (action === 'edit') {
      this.setState({
        action: action,
        id: search.get('id')
      })
    }
    else {
      this.setState({
        action: action
      })
    }
  };

  validateIp = (rule, value, callback) => {
    if (value !== '') {
      if (!isIP(value)) {
        callback(<FormattedMessage id="app.operator.newAgent.error.ip" defaultMessage="Please enter a valid IP address.For example:192.168.0.10." />);
      } else {
        callback();
      }
    }
    else {
      callback();
    }
  };

  submitCallback = data => {
    if (this.state.action === 'edit') {

    }
    else {
      if (data.id) {
        message.success(
          formatMessage(
            {
              id: 'app.operator.newAgent.success',
              defaultMessage: 'Create agent {name} success',
            },
            {
              name: data.payload.formData.get('name'),
            }
          )
        );
        this.props.dispatch(
          routerRedux.push({
            pathname: '/operator/agent',
          })
        );
      } else {
        message.error(
          formatMessage(
            {
              id: 'app.operator.newAgent.fail',
              defaultMessage: 'Create user {name} failed',
            },
            {
              name: data.payload.formData.get('name'),
            }
          )
        );
      }
    }
  };

  handleSubmit = e => {
    e.preventDefault();
    const action = this.state.action;
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        if (action === 'edit') {
          this.props.dispatch({
            type: 'agent/updateAgent',
            payload: data,
          });
        }
        else {
          const formData = new FormData();

          Object.keys(values).forEach(key => {
            if (key === 'config_file') {
              if (this.state.fileList.length > 0) {
                formData.append(key, this.state.fileList[0]);
              }
            }
            else {
              formData.append(key, values[key]);
            }
          });

          this.props.dispatch({
            type: 'agent/createAgent',
            payload: {
              formData: formData,
            },
            callback: this.submitCallback
          });
        }
      }
    });
  };

  normFile = e => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const { submitting, updating } = this.props;
    const location = this.props.location || this.context.location;
    const search = new URLSearchParams(location.search);
    const action = search.get('action');
    const currentAgent = {};
    const schedulable = action === 'edit' ? '' : true;
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
    const agentTypeValues = ['docker', 'kubernetes'];
    const agentTypeOptions = agentTypeValues.map(item => (
      <Option value={item} key={item}>
        <span>{item}</span>
      </Option>
    ));
    const logLevelValues = ['info', 'warning', 'debug', 'error', 'critical'];
    const logLevelOptions = logLevelValues.map(item => (
      <Option value={item} key={item}>
        <span>{item}</span>
      </Option>
    ));

    const selectProps = {
      onRemove: () => {
        this.setState({fileList:[]});
      },
      beforeUpload: file => {
        this.setState({fileList: [file]});
        return false;
      },
      fileList: this.state.fileList,
    };

    return (
      <PageHeaderWrapper
        title={
          action === 'create'
            ? <FormattedMessage id="app.operator.newAgent.title" defaultMessage="Create Agent" />
            : <FormattedMessage id="app.operator.editAgent.title" defaultMessage="Edit Agent" />
        }
      >
        <Card bordered={false}>
          <Form onSubmit={this.handleSubmit} hideRequiredMark style={{ marginTop: 8 }}>
            <FormItem {...formItemLayout} label={<FormattedMessage id="app.operator.newAgent.label.name" defaultMessage="Name" />}>
              {getFieldDecorator('name', {
                initialValue: action === 'create' ? '' : currentAgent.name,
                rules: [
                  {
                    required: false,
                    message: <FormattedMessage id="app.operator.newAgent.Required.Name" defaultMessage="Please input name." />,
                  },
                ],
              })(<Input placeholder={formatMessage({id:"app.operator.newAgent.label.name", defaultMessage:"Name"})} />)}
            </FormItem>
            <FormItem {...formItemLayout} label={<FormattedMessage id="app.operator.newAgent.label.ip" defaultMessage="Agent IP Address" />}>
              {getFieldDecorator('ip', {
                initialValue: action === 'create' ? '' : currentAgent.ip,
                rules: [
                  {
                    required: true,
                    message: <FormattedMessage id="app.operator.newAgent.required.ip" defaultMessage="Please input the ip address of the agent." />,
                  },
                  {
                    validator: this.validateIp,
                  },
                ],
              })(<Input disabled={action === 'update'} placeholder="192.168.0.10" />)}
            </FormItem>
            <FormItem {...formItemLayout} label={<FormattedMessage id="app.operator.newAgent.label.image" defaultMessage="Image name of deploy agent" />}>
              {getFieldDecorator('image', {
                initialValue: action === 'create' ? '' : currentAgent.image,
                rules: [
                  {
                    required: true,
                    message: <FormattedMessage id="app.operator.newAgent.required.image" defaultMessage="Please input the name of the agent's image." />,
                  },
                ],
              })(<Input placeholder={formatMessage({id:"app.operator.newAgent.label.image", defaultMessage:"Image name of deploy agent"})} />)}
            </FormItem>
            <FormItem {...formItemLayout} label={<FormattedMessage id="app.operator.newAgent.label.agentCapacity" defaultMessage="Capacity of agent" />}>
              {getFieldDecorator('capacity', {
                initialValue: action === 'create' ? 1 : currentAgent.capacity,
                rules: [
                  {
                    required: true,
                    message: <FormattedMessage id="app.operator.newAgent.required.agentCapacity" defaultMessage="Please input the capacity of the agent." />,
                  },
                ],
              })(
                <InputNumber
                  placeholder={formatMessage({id:"app.operator.newAgent.label.agentCapacity", defaultMessage:"Capacity of agent"})}
                  min={1}
                  max={100}
                />
              )}
            </FormItem>
            <FormItem {...formItemLayout} label={<FormattedMessage id="app.operator.newAgent.label.nodeCapacity" defaultMessage="Capacity of nodes" />}>
              {getFieldDecorator('node_capacity', {
                initialValue: action === 'create' ? 10 : currentAgent.node_capacity,
                rules: [
                  {
                    required: true,
                    message: <FormattedMessage id="app.operator.newAgent.required.nodeCapacity" defaultMessage="Please input the capacity of nodes." />,
                  },
                ],
              })(
                <InputNumber
                  placeholder={formatMessage({id:"app.operator.newAgent.label.nodeCapacity", defaultMessage:"Capacity of nodes"})}
                  min={1}
                  max={600}
                />
              )}
            </FormItem>
            <FormItem {...formItemLayout} label={<FormattedMessage id="app.operator.newAgent.label.type" defaultMessage="Type" />}>
              {getFieldDecorator('type', {
                initialValue: action === 'create' ? agentTypeValues[0] : currentAgent.type,
                rules: [
                  {
                    required: true,
                    message: <FormattedMessage id="app.operator.newAgent.Required.type" defaultMessage="Please select a type." />,
                  },
                ],
              })(
                <Select disabled={action !== 'create'}>
                  {agentTypeOptions}
                </Select>
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label={<FormattedMessage id="app.operator.newAgent.label.configFile" defaultMessage="Config file" />}
            >
              {getFieldDecorator('config_file', {
                getValueFromEvent: this.normFile,
                initialValue: this.state.fileList,
              })(
                <Upload {...selectProps} >
                  <Button disabled={this.state.fileList.length > 0}>
                    <Icon type="upload" /> {<FormattedMessage id="app.operator.newAgent.label.configFileSelect" defaultMessage="Please select the config file." />}
                  </Button>
                </Upload>
              )}
            </FormItem>
            <FormItem {...formItemLayout} label={<FormattedMessage id="app.operator.newAgent.label.logLevel" defaultMessage="Log level" />}>
              {getFieldDecorator('log_level', {
                initialValue: action === 'create' ? logLevelValues[0] : currentAgent.log_level,
                rules: [
                  {
                    required: false,
                    message: <FormattedMessage id="app.operator.newAgent.Required.LogLevel" defaultMessage="Please select a log level." />,
                  },
                ],
              })(<Select>{logLevelOptions}</Select>)}
            </FormItem>
            <FormItem {...formItemLayout} label={<FormattedMessage id="app.operator.newAgent.label.schedulable" defaultMessage="Schedulable" />}>
              {getFieldDecorator('schedulable', {
                initialValue: schedulable
              })(
                <Switch defaultChecked={schedulable}/>
              )}
            </FormItem>
            <FormItem {...submitFormLayout} style={{ marginTop: 32 }}>
              <Button onClick={this.clickCancel} >
                <FormattedMessage id="form.button.cancel" defaultMessage="Cancel" />
              </Button>
              <Button loading={action === 'create' ? submitting : updating} type="primary" htmlType="submit" style={{ marginLeft: 8 }}>
                <FormattedMessage id="form.button.submit" defaultMessage="Submit" />
              </Button>
            </FormItem>
          </Form>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default CreateAgent;
