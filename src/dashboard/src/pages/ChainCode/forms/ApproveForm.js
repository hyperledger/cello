import React, { useState, useEffect } from 'react';
import { injectIntl, useIntl } from 'umi';
import { Modal, message, Select, Form, Tag, Input, Checkbox } from 'antd';
import { listChannel } from '@/services/channel';
import styles from '../styles.less';

const FormItem = Form.Item;

const ApproveForm = props => {
  const [form] = Form.useForm();
  const intl = useIntl();
  const [channels, setChannels] = useState();
  const {
    approveModalVisible,
    handleApprove,
    handleApproveModalVisible,
    approving,
    fetchChainCodes,
    initFlagChange,
  } = props;

  useEffect(() => {
    async function fecthData() {
      const response = await listChannel();
      setChannels(response.data.data);
    }
    fecthData();
  }, []);

  const approveCallback = response => {
    if (response.status !== 'successful') {
      message.error(
        intl.formatMessage({
          id: 'app.operator.chainCode.form.approve.fail',
          defaultMessage: 'Approve chaincode failed',
        })
      );
    } else {
      message.success(
        intl.formatMessage({
          id: 'app.operator.chainCode.form.approve.success',
          defaultMessage: 'Approve chaincode succeed',
        })
      );
      form.resetFields();
      handleApproveModalVisible();
      fetchChainCodes();
    }
  };

  const onSubmit = () => {
    form.submit();
  };

  const onFinish = values => {
    handleApprove(values, approveCallback);
  };

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 11 },
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
        id: 'app.operator.chainCode.form.approve.header.title',
        defaultMessage: 'Approve Chaincode',
      })}
      confirmLoading={approving}
      open={approveModalVisible}
      onOk={onSubmit}
      onCancel={() => handleApproveModalVisible(false)}
    >
      <Form onFinish={onFinish} form={form} preserve={false}>
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.chainCode.form.approve.channel',
            defaultMessage: 'Please select channel',
          })}
          name="channel"
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'app.operator.chainCode.form.approve.channel',
                defaultMessage: 'Please select channel',
              }),
            },
          ]}
        >
          <Select
            mode="multiple"
            options={channels} // dummyChannels changed
            tagRender={tagRender}
            defaultValue={[]}
            dropdownClassName={styles.dropdownClassName}
          />
        </FormItem>
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.chainCode.form.approve.specifyName',
            defaultMessage: 'Name for chaincode',
          })}
          name="name"
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'app.operator.chainCode.form.approve.specifyName',
                defaultMessage: 'Name for chaincode',
              }),
            },
          ]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'app.operator.chainCode.form.approve.name',
              defaultMessage: 'Name',
            })}
          />
        </FormItem>
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.chainCode.form.initFlag',
            defaultMessage: '--init-required flag',
          })}
          name="initFlag"
        >
          <Checkbox onChange={initFlagChange} />
        </FormItem>
      </Form>
    </Modal>
  );
};

export default injectIntl(ApproveForm);
