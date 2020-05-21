import React, { Fragment } from 'react';
import { Form, Button, Select } from 'antd';
import querystring from 'querystring';
import { useIntl, history } from 'umi';
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

@Form.create()
class InputBasicInfo extends React.PureComponent {
  getNetworkVersionOptions = () => {
    const {
      form: { getFieldValue },
    } = this.props;
    const networkType = getFieldValue('network_type');
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
    const {
      form: { getFieldValue },
    } = this.props;
    const networkType = getFieldValue('network_type');
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

  validateForm = () => {
    const {
      form: { validateFields },
    } = this.props;
    validateFields((err, values) => {
      if (!err) {
        const params = querystring.stringify(values);
        history.push(`/operator/node/new/node-info?${params}`);
      }
    });
  };

  render() {
    const { form, location } = this.props;
    const { query = {} } = location;
    const intl = useIntl();
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
        <Form layout="horizontal" className={classNames(styles.stepForm, styles.stepInputForm)}>
          <Form.Item
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label={intl.formatMessage({
              id: 'app.operator.node.new.inputBasic.form.networkType.label',
              defaultMessage: 'Network Type',
            })}
          >
            {form.getFieldDecorator('network_type', {
              initialValue: networkType,
              rules: [
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'app.operator.node.new.inputBasic.form.networkType.required',
                    defaultMessage: 'Please Select Network Type',
                  }),
                },
              ],
            })(
              <Select
                placeholder={intl.formatMessage({
                  id: 'app.operator.node.new.inputBasic.form.networkType.placeholder',
                  defaultMessage: 'Select Network Type',
                })}
              >
                {networkTypeOptions}
              </Select>
            )}
          </Form.Item>
          <Form.Item
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label={intl.formatMessage({
              id: 'app.operator.node.new.inputBasic.form.agentType.label',
              defaultMessage: 'Agent Type',
            })}
          >
            {form.getFieldDecorator('agent_type', {
              initialValue: agentType,
              rules: [
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'app.operator.node.new.inputBasic.form.agentType.required',
                    defaultMessage: 'Please Select Agent Type',
                  }),
                },
              ],
            })(
              <Select
                placeholder={intl.formatMessage({
                  id: 'app.operator.node.new.inputBasic.form.agentType.placeholder',
                  defaultMessage: 'Select Agent Type',
                })}
              >
                {agentTypeOptions}
              </Select>
            )}
          </Form.Item>
          <Form.Item
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label={intl.formatMessage({
              id: 'app.operator.node.new.inputBasic.form.networkVersion.label',
              defaultMessage: 'Network Version',
            })}
          >
            {form.getFieldDecorator('network_version', {
              initialValue: networkVersion,
              rules: [
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'app.operator.node.new.inputBasic.form.networkVersion.required',
                    defaultMessage: 'Please Select Network Version',
                  }),
                },
              ],
            })(
              <Select
                placeholder={intl.formatMessage({
                  id: 'app.operator.node.new.inputBasic.form.networkVersion.placeholder',
                  defaultMessage: 'Select Network Version',
                })}
              >
                {getNetworkVersionOptions()}
              </Select>
            )}
          </Form.Item>
          <Form.Item
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            label={intl.formatMessage({
              id: 'app.operator.node.new.inputBasic.form.nodeType.label',
              defaultMessage: 'Node Type',
            })}
          >
            {form.getFieldDecorator('type', {
              initialValue: nodeType,
              rules: [
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'app.operator.node.new.inputBasic.form.nodeType.required',
                    defaultMessage: 'Please Select Node Type',
                  }),
                },
              ],
            })(
              <Select
                placeholder={intl.formatMessage({
                  id: 'app.operator.node.new.inputBasic.form.nodeType.placeholder',
                  defaultMessage: 'Select Node Type',
                })}
              >
                {getNetworkNodeTypeOptions()}
              </Select>
            )}
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
            <Button type="primary" onClick={this.validateForm} style={{ marginLeft: 8 }}>
              {intl.formatMessage({ id: 'form.button.next', defaultMessage: 'Next' })}
            </Button>
          </Form.Item>
        </Form>
      </Fragment>
    );
  }
}

export default InputBasicInfo;
