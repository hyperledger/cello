import React, { PureComponent } from 'react';
import { injectIntl, connect } from 'umi';
import { Modal, message, Select, Form, Tag } from 'antd';
import styles from '../styles.less';

const FormItem = Form.Item;

const InstallFormWrapper = props => {
  const [form] = Form.useForm();
  return <InstallForm {...props} form={form} />;
};

@connect(({ chainCode }) => ({
  chainCode,
}))
class InstallForm extends PureComponent {
  handleInstall = (values, callback, chainCodeName) => {
    const { dispatch } = this.props;
    const formData = new FormData();
    Object.keys(values).forEach(key => {
      formData.append(key, values[key]);
    });
    formData.append('chaincode', chainCodeName);
    dispatch({
      type: 'chainCode/installChainCode',
      payload: formData,
      callback,
    });
  };

  render() {
    const {
      installModalVisible,
      handleInstallModalVisible,
      installing,
      fetchChainCodes,
      intl,
      nodes,
      form,
      chainCodeName,
    } = this.props;

    const nodeList = nodes.map(node => {
      return {
        label: node.urls,
        value: node.id,
      };
    });
    const installCallback = response => {
      if (response.status !== 'successful') {
        message.error(
          intl.formatMessage({
            id: 'app.operator.chainCode.form.install.fail',
            defaultMessage: 'Install chaincode failed',
          })
        );
      } else {
        message.success(
          intl.formatMessage({
            id: 'app.operator.chainCode.form.install.success',
            defaultMessage: 'Install chaincode succeed',
          })
        );
        form.resetFields();
        handleInstallModalVisible();
        fetchChainCodes();
      }
    };

    const onSubmit = () => {
      form.submit();
    };

    const onFinish = values => {
      this.handleInstall(values, installCallback, chainCodeName);
    };

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

    // eslint-disable-next-line no-shadow
    const tagRender = props => {
      const { label, closable, onClose } = props;
      const onPreventMouseDown = event => {
        event.preventDefault();
        event.stopPropagation();
      };
      return (
        <Tag
          color="cyan"
          onMouseDown={onPreventMouseDown}
          closable={closable}
          onClose={onClose}
          style={{ marginRight: 3 }}
        >
          {label}
        </Tag>
      );
    };

    return (
      <Modal
        destroyOnClose
        title={intl.formatMessage({
          id: 'app.operator.chainCode.form.install.header.title',
          defaultMessage: 'Install Chaincode',
        })}
        confirmLoading={installing}
        open={installModalVisible}
        onOk={onSubmit}
        onCancel={() => handleInstallModalVisible(false)}
      >
        <Form onFinish={onFinish} form={form} preserve={false}>
          <FormItem
            {...formItemLayout}
            label={intl.formatMessage({
              id: 'app.operator.chaincode.form.install.nodes',
              defaultMessage: 'Please select nodes',
            })}
            name="peer_uuid"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'app.operator.chaincode.form.install.checkNodes',
                  defaultMessage: 'Please select nodes',
                }),
              },
            ]}
          >
            <Select
              mode="multiple"
              options={nodeList}
              tagRender={tagRender}
              popupClassName={styles.dropdownClassName}
            />
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default injectIntl(InstallFormWrapper);
