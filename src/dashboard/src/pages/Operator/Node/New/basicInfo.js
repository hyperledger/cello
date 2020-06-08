import React, { Fragment } from 'react';
import { Form, Button, Select } from 'antd';
import querystring from 'querystring';
import { injectIntl, history } from 'umi';
import classNames from 'classnames';
import { networkTypes, agentTypes, fabricVersions, fabricNodeTypes } from '@/utils/networks';
import styles from './styles.less';

const SelectOption = Select.Option;

const formItemLayout = {
  labelCol: {
    span: 5,
  },
  wrapperCol: {
    span: 19,
  },
};

class InputBasicInfo extends React.Component {
  formRef = React.createRef();

  getNetworkType = () => {
    let networkType = 'fabric';
    if (this.formRef.current) {
      networkType = this.formRef.current.getFieldValue('network_type');
    }
    return networkType;
  };

  getNetworkVersionOptions = () => {
    const networkType = this.getNetworkType();
    let versions = [];
    switch (networkType) {
      case 'fabric':
        versions = fabricVersions;
        break;
      default:
        versions = fabricVersions;
        break;
    }
    return versions.map(fabricVersion => (
      <SelectOption key={fabricVersion.value} value={fabricVersion.value}>
        {fabricVersion.name}
      </SelectOption>
    ));
  };

  getNetworkNodeTypeOptions = () => {
    const networkType = this.getNetworkType();
    let nodeTypeList = [];
    switch (networkType) {
      case 'fabric':
        nodeTypeList = fabricNodeTypes;
        break;
      default:
        nodeTypeList = fabricNodeTypes;
        break;
    }
    return nodeTypeList.map(node => (
      <SelectOption key={node.value} value={node.value}>
        {node.name}
      </SelectOption>
    ));
  };

  validateForm = values => {
    const params = querystring.stringify(values);
    history.push(`/operator/node/new/node-info?${params}`);
  };

  render() {
    const { location, intl } = this.props;
    const { query = {} } = location;
    const {
      network_type: networkType = networkTypes[0].value,
      network_version: networkVersion,
      type: nodeType,
      agent_type: agentType = agentTypes[0].value,
    } = query;
    const { getNetworkVersionOptions, getNetworkNodeTypeOptions } = this;
    const networkTypeOptions = networkTypes.map(network => (
      <SelectOption key={network.value} value={network.value}>
        {network.name}
      </SelectOption>
    ));
    const agentTypeOptions = agentTypes.map(agent => (
      <SelectOption key={agent.value} value={agent.value}>
        {agent.name}
      </SelectOption>
    ));
    return (
      <Fragment>
        <Form
          ref={this.formRef}
          layout="horizontal"
          onFinish={this.validateForm}
          className={classNames(styles.stepForm, styles.stepInputForm)}
          initialValues={{
            network_type: networkType,
            agent_type: agentType,
            network_version: networkVersion,
            type: nodeType,
          }}
        >
          <Form.Item
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label={intl.formatMessage({
              id: 'app.operator.node.new.inputBasic.form.networkType.label',
              defaultMessage: 'Network Type',
            })}
            name="network_type"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'app.operator.node.new.inputBasic.form.networkType.required',
                  defaultMessage: 'Please Select Network Type',
                }),
              },
            ]}
          >
            <Select
              placeholder={intl.formatMessage({
                id: 'app.operator.node.new.inputBasic.form.networkType.placeholder',
                defaultMessage: 'Select Network Type',
              })}
            >
              {networkTypeOptions}
            </Select>
          </Form.Item>
          <Form.Item
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label={intl.formatMessage({
              id: 'app.operator.node.new.inputBasic.form.agentType.label',
              defaultMessage: 'Agent Type',
            })}
            name="agent_type"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'app.operator.node.new.inputBasic.form.agentType.required',
                  defaultMessage: 'Please Select Agent Type',
                }),
              },
            ]}
          >
            <Select
              placeholder={intl.formatMessage({
                id: 'app.operator.node.new.inputBasic.form.agentType.placeholder',
                defaultMessage: 'Select Agent Type',
              })}
            >
              {agentTypeOptions}
            </Select>
          </Form.Item>
          <Form.Item
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label={intl.formatMessage({
              id: 'app.operator.node.new.inputBasic.form.networkVersion.label',
              defaultMessage: 'Network Version',
            })}
            name="network_version"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'app.operator.node.new.inputBasic.form.networkVersion.required',
                  defaultMessage: 'Please Select Network Version',
                }),
              },
            ]}
          >
            <Select
              placeholder={intl.formatMessage({
                id: 'app.operator.node.new.inputBasic.form.networkVersion.placeholder',
                defaultMessage: 'Select Network Version',
              })}
            >
              {getNetworkVersionOptions()}
            </Select>
          </Form.Item>
          <Form.Item
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label={intl.formatMessage({
              id: 'app.operator.node.new.inputBasic.form.nodeType.label',
              defaultMessage: 'Node Type',
            })}
            name="type"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'app.operator.node.new.inputBasic.form.nodeType.required',
                  defaultMessage: 'Please Select Node Type',
                }),
              },
            ]}
          >
            <Select
              placeholder={intl.formatMessage({
                id: 'app.operator.node.new.inputBasic.form.nodeType.placeholder',
                defaultMessage: 'Select Node Type',
              })}
            >
              {getNetworkNodeTypeOptions()}
            </Select>
          </Form.Item>
          <Form.Item
            wrapperCol={{
              xs: { span: 24, offset: 0 },
              sm: {
                span: formItemLayout.wrapperCol.span,
                offset: formItemLayout.labelCol.span,
              },
            }}
            label=""
          >
            <Button onClick={() => history.push(`/operator/node`)}>
              {intl.formatMessage({ id: 'form.button.cancel', defaultMessage: 'Cancel' })}
            </Button>
            <Button type="primary" htmlType="submit" style={{ marginLeft: 8 }}>
              {intl.formatMessage({ id: 'form.button.next', defaultMessage: 'Next' })}
            </Button>
          </Form.Item>
        </Form>
      </Fragment>
    );
  }
}

export default injectIntl(InputBasicInfo);
