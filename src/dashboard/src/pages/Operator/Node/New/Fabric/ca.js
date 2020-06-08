import React from 'react';
import { Form, Button, Select, Input } from 'antd';
import { injectIntl } from 'umi';
import classNames from 'classnames';
import styles from '../styles.less';

const SelectOption = Select.Option;
const caTypes = [
  { name: 'TLS', value: 'tls' },
  { name: 'Signature', value: 'signature' },
];

const formItemLayout = {
  labelCol: {
    span: 5,
  },
  wrapperCol: {
    span: 19,
  },
};

class FabricCa extends React.PureComponent {
  formRef = React.createRef();

  validateForm = values => {
    const { agentType, networkType, networkVersion, nodeType, onSubmit } = this.props;
    // eslint-disable-next-line no-param-reassign
    delete values.admin_password_confirm;
    const data = {
      network_type: networkType,
      network_version: networkVersion,
      agent_type: agentType,
      type: nodeType,
      ca: values,
    };
    onSubmit(data);
  };

  render() {
    const { prevBtn, creating, intl } = this.props;
    const caTypeOptions = caTypes.map(caType => (
      <SelectOption value={caType.value} key={caType.value}>
        {caType.name}
      </SelectOption>
    ));
    const validatePasswordConfirm = async (rule, value) => {
      if (this.formRef.current) {
        if (value && this.formRef.current.getFieldValue('admin_password') !== value) {
          throw new Error(
            intl.formatMessage({
              id: 'app.operator.user.form.passwordConfirm.noValid',
              defaultMessage: 'Inconsistent password input twice',
            })
          );
        }
      }
    };
    return (
      <Form
        ref={this.formRef}
        layout="horizontal"
        onFinish={this.validateForm}
        className={classNames(styles.stepForm, styles.stepInputForm)}
      >
        <Form.Item
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 15 }}
          name="admin_name"
          label={intl.formatMessage({
            id: 'fabric.ca.form.adminName.label',
            defaultMessage: 'Admin Username',
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'fabric.ca.form.adminName.required',
                defaultMessage: 'Please input Admin Username',
              }),
            },
          ]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'fabric.ca.form.adminName.placeholder',
              defaultMessage: 'Input Admin Username',
            })}
          />
        </Form.Item>
        <Form.Item
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 15 }}
          label={intl.formatMessage({
            id: 'fabric.ca.form.adminPassword.label',
            defaultMessage: 'Admin Password',
          })}
          name="admin_password"
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'fabric.ca.form.adminPassword.required',
                defaultMessage: 'Please Input Admin Password',
              }),
            },
          ]}
        >
          <Input.Password
            placeholder={intl.formatMessage({
              id: 'fabric.ca.form.adminPassword.placeholder',
              defaultMessage: 'Input Admin Password',
            })}
          />
        </Form.Item>
        <Form.Item
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 15 }}
          label={intl.formatMessage({
            id: 'app.operator.user.form.passwordConfirm.label',
            defaultMessage: 'Password Confirm',
          })}
          name="admin_password_confirm"
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'fabric.ca.form.adminPassword.required',
                defaultMessage: 'Please Input Admin Password',
              }),
            },
            {
              validator: validatePasswordConfirm,
            },
          ]}
        >
          <Input.Password
            placeholder={intl.formatMessage({
              id: 'fabric.ca.form.adminPassword.placeholder',
              defaultMessage: 'Input Admin Password',
            })}
          />
        </Form.Item>
        <Form.Item
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 15 }}
          label={intl.formatMessage({
            id: 'fabric.ca.form.caType.label',
            defaultMessage: 'CA Type',
          })}
          name="type"
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'fabric.ca.form.caType.required',
                defaultMessage: 'Please Select CA Type',
              }),
            },
          ]}
        >
          <Select
            placeholder={intl.formatMessage({
              id: 'fabric.ca.form.caType.placeholder',
              defaultMessage: 'Select CA Type',
            })}
          >
            {caTypeOptions}
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
          {prevBtn}
          <Button type="primary" htmlType="submit" style={{ marginLeft: 8 }} loading={creating}>
            {intl.formatMessage({ id: 'form.button.submit', defaultMessage: 'Submit' })}
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

export default injectIntl(FabricCa);
