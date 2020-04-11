/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent } from 'react';
import { Card, Form, Input, Button, Select } from 'antd';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import styles from './index.less';

const FormItem = Form.Item;
const { Option } = Select;

const messages = defineMessages({
  updateTitle: {
    id: 'Host.Create.UpdateTitle',
    defaultMessage: 'Update Host',
  },
  title: {
    id: 'Chain.Create.Title',
    defaultMessage: 'Create New Chain',
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
    host: {
      id: 'Chain.Create.Label.Host',
      defaultMessage: 'Host',
    },
    networkType: {
      id: 'Chain.Label.NetworkType',
      defaultMessage: 'Network Type',
    },
    consensusPlugin: {
      id: 'Chain.Label.ConsensusPlugin',
      defaultMessage: 'Consensus Plugin',
    },
    chainSize: {
      id: 'Chain.Create.Label.ChainSize',
      defaultMessage: 'Chain Size',
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
      host: {
        id: 'Chain.Create.Validate.Required.Host',
        defaultMessage: 'Must select a host',
      },
    },
  },
});

@connect(({ host, loading }) => ({
  host,
  loadingHosts: loading.effects['host/fetchHosts'],
}))
@Form.create()
class CreateChain extends PureComponent {
  state = {
    submitting: false,
  };
  componentDidMount() {
    this.props.dispatch({
      type: 'host/fetchHosts',
    });
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
        this.setState({
          submitting: true,
        });
        this.props.dispatch({
          type: 'chain/createChain',
          payload: {
            ...values,
            callback: this.submitCallback,
          },
        });
      }
    });
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const { intl, host } = this.props;
    const { submitting } = this.state;
    const { hosts } = host;
    const availableHosts = hosts.filter(hostItem => hostItem.capacity > hostItem.clusters.length);
    const hostOptions = availableHosts.map(hostItem => (
      <Option value={hostItem.id}>{hostItem.name}</Option>
    ));
    const networkTypes = ['fabric-1.0','fabric-1.1'];
    const networkTypeOptions = networkTypes.map(networkType => (
      <Option value={networkType}>{networkType}</Option>
    ));
    const chainSizes = [4];
    const chainSizeOptions = chainSizes.map(chainSize => (
      <Option value={chainSize}>{chainSize}</Option>
    ));
    const consensusPlugins = ['solo', 'kafka'];
    const consensusPluginOptions = consensusPlugins.map(consensusPlugin => (
      <Option value={consensusPlugin}>
        <span className={styles.upperText}>{consensusPlugin}</span>
      </Option>
    ));

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
    return (
      <PageHeaderLayout title={intl.formatMessage(messages.title)}>
        <Card bordered={false}>
          <Form onSubmit={this.handleSubmit} hideRequiredMark style={{ marginTop: 8 }}>
            <FormItem {...formItemLayout} label={intl.formatMessage(messages.label.name)}>
              {getFieldDecorator('name', {
                initialValue: '',
                rules: [
                  {
                    required: true,
                    message: intl.formatMessage(messages.validate.required.name),
                  },
                ],
              })(<Input placeholder={intl.formatMessage(messages.label.name)} />)}
            </FormItem>
            <FormItem {...formItemLayout} label={intl.formatMessage(messages.label.host)}>
              {getFieldDecorator('host_id', {
                initialValue: availableHosts.length > 0 ? availableHosts[0].id : '',
                rules: [
                  {
                    required: true,
                    message: intl.formatMessage(messages.validate.required.host),
                  },
                ],
              })(<Select>{hostOptions}</Select>)}
            </FormItem>
            <FormItem {...formItemLayout} label={intl.formatMessage(messages.label.networkType)}>
              {getFieldDecorator('network_type', {
                initialValue: networkTypes[0],
                rules: [
                  {
                    required: true,
                    message: 'Must select network type',
                  },
                ],
              })(<Select>{networkTypeOptions}</Select>)}
            </FormItem>
            <FormItem {...formItemLayout} label={intl.formatMessage(messages.label.chainSize)}>
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
            <FormItem
              {...formItemLayout}
              label={intl.formatMessage(messages.label.consensusPlugin)}
            >
              {getFieldDecorator('consensus_plugin', {
                initialValue: consensusPlugins[0],
                rules: [
                  {
                    required: true,
                    message: 'Must select consensus plugin',
                  },
                ],
              })(<Select>{consensusPluginOptions}</Select>)}
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

export default injectIntl(CreateChain);
