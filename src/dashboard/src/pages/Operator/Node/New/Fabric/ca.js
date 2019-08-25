import React from 'react';
import { Form, Button, Select, Input } from 'antd';
import { FormattedMessage, formatMessage } from 'umi-plugin-react/locale';
import classNames from 'classnames';
import styles from '../styles.less';

const SelectOption = Select.Option;
const caTypes = [{ name: 'TLS', value: 'tls' }, { name: 'Signature', value: 'signature' }];

const formItemLayout = {
  labelCol: {
    span: 5,
  },
  wrapperCol: {
    span: 19,
  },
};

@Form.create()
class FabricCa extends React.PureComponent {
  validateForm = () => {
    const {
      form: { validateFields },
      agentType,
      networkType,
      networkVersion,
      nodeType,
      onSubmit,
    } = this.props;
    validateFields((err, values) => {
      if (!err) {
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
      }
    });
  };

  render() {
    const { prevBtn, form, creating } = this.props;
    const caTypeOptions = caTypes.map(caType => (
      <SelectOption value={caType.value} key={caType.value}>
        {caType.name}
      </SelectOption>
    ));
    const { getFieldValue } = form;
    const validatePasswordConfirm = (rule, value, callback) => {
      if (value && getFieldValue('admin_password') !== value) {
        callback(
          formatMessage({
            id: 'app.operator.user.form.passwordConfirm.noValid',
            defaultMessage: 'Inconsistent password input twice',
          })
        );
      }
      callback();
    };
    return (
      <Form layout="horizontal" className={classNames(styles.stepForm, styles.stepInputForm)}>
        <Form.Item
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 15 }}
          label={formatMessage({
            id: 'fabric.ca.form.adminName.label',
            defaultMessage: 'Admin Username',
          })}
        >
          {form.getFieldDecorator('admin_name', {
            rules: [
              {
                required: true,
                message: formatMessage({
                  id: 'fabric.ca.form.adminName.required',
                  defaultMessage: 'Please input Admin Username',
                }),
              },
            ],
          })(
            <Input
              placeholder={formatMessage({
                id: 'fabric.ca.form.adminName.placeholder',
                defaultMessage: 'Input Admin Username',
              })}
            />
          )}
        </Form.Item>
        <Form.Item
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 15 }}
          label={formatMessage({
            id: 'fabric.ca.form.adminPassword.label',
            defaultMessage: 'Admin Password',
          })}
        >
          {form.getFieldDecorator('admin_password', {
            rules: [
              {
                required: true,
                message: formatMessage({
                  id: 'fabric.ca.form.adminPassword.required',
                  defaultMessage: 'Please Input Admin Password',
                }),
              },
            ],
          })(
            <Input.Password
              placeholder={formatMessage({
                id: 'fabric.ca.form.adminPassword.placeholder',
                defaultMessage: 'Input Admin Password',
              })}
            />
          )}
        </Form.Item>
        <Form.Item
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 15 }}
          label={formatMessage({
            id: 'app.operator.user.form.passwordConfirm.label',
            defaultMessage: 'Password Confirm',
          })}
        >
          {form.getFieldDecorator('admin_password_confirm', {
            rules: [
              {
                required: true,
                message: formatMessage({
                  id: 'fabric.ca.form.adminPassword.required',
                  defaultMessage: 'Please Input Admin Password',
                }),
              },
              {
                validator: validatePasswordConfirm,
              },
            ],
          })(
            <Input.Password
              placeholder={formatMessage({
                id: 'fabric.ca.form.adminPassword.placeholder',
                defaultMessage: 'Input Admin Password',
              })}
            />
          )}
        </Form.Item>
        <Form.Item
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 15 }}
          label={formatMessage({
            id: 'fabric.ca.form.caType.label',
            defaultMessage: 'CA Type',
          })}
        >
          {form.getFieldDecorator('type', {
            initialValue: caTypes[0].value,
            rules: [
              {
                required: true,
                message: formatMessage({
                  id: 'fabric.ca.form.caType.required',
                  defaultMessage: 'Please Select CA Type',
                }),
              },
            ],
          })(
            <Select
              placeholder={formatMessage({
                id: 'fabric.ca.form.caType.placeholder',
                defaultMessage: 'Select CA Type',
              })}
            >
              {caTypeOptions}
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
          {prevBtn}
          <Button
            type="primary"
            style={{ marginLeft: 8 }}
            onClick={this.validateForm}
            loading={creating}
          >
            <FormattedMessage id="form.button.submit" defaultMessage="Submit" />
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

export default FabricCa;
