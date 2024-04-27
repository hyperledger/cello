import React from 'react';
import { injectIntl, useIntl } from 'umi';
import { Button, Modal, Input, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { Form } from 'antd/lib/index';

const FormItem = Form.Item;

const UploadForm = props => {
  const [form] = Form.useForm();
  const intl = useIntl();
  const {
    modalVisible,
    handleUpload,
    handleModalVisible,
    uploading,
    fetchChainCodes,
    newFile,
    setFile,
  } = props;

  const uploadCallback = response => {
    if (response.status !== 'successful') {
      message.error(
        intl.formatMessage({
          id: 'app.chainCode.form.create.fail',
          defaultMessage: 'Upload chaincode failed',
        })
      );
    } else {
      message.success(
        intl.formatMessage({
          id: 'app.chainCode.form.create.success',
          defaultMessage: 'Upload chaincode succeed',
        })
      );
      form.resetFields();
      handleModalVisible();
      fetchChainCodes();
      setFile(null);
    }
  };

  const onSubmit = () => {
    form.submit();
  };

  const onFinish = values => {
    handleUpload(values, uploadCallback);
  };

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 7 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 14 },
      md: { span: 12 },
    },
  };

  const uploadProps = {
    onRemove: () => {
      setFile(null);
    },
    beforeUpload: file => {
      setFile(file);
      return false;
    },
  };

  const normFile = e => {
    if (Array.isArray(e)) {
      return e;
    }
    return newFile;
  };

  return (
    <Modal
      destroyOnClose
      title={intl.formatMessage({
        id: 'app.chainCode.form.create.header.title',
        defaultMessage: 'Upload chaincode',
      })}
      confirmLoading={uploading}
      open={modalVisible}
      onOk={onSubmit}
      onCancel={() => handleModalVisible(false)}
    >
      <Form onFinish={onFinish} form={form} preserve={false}>
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.chainCode.form.create.file',
            defaultMessage: 'Package',
          })}
          name="file"
          getValueFromEvent={normFile}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'app.chainCode.form.create.fileSelect',
                defaultMessage: 'Please select the chaincode package',
              }),
            },
          ]}
          extra="Only tar.gz file is supported"
        >
          <Upload {...uploadProps}>
            <Button disabled={!!newFile}>
              <UploadOutlined />
              {intl.formatMessage({
                id: 'app.chainCode.form.create.fileSelect',
                defaultMessage: 'Please select the chaincode package',
              })}
            </Button>
          </Upload>
        </FormItem>
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.chainCode.form.create.description',
            defaultMessage: 'Description',
          })}
          name="description"
          initialValue=""
          rules={[
            {
              required: false,
            },
          ]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'app.chainCode.form.create.description',
              defaultMessage: 'Chaincode Description',
            })}
          />
        </FormItem>
      </Form>
    </Modal>
  );
};

export default injectIntl(UploadForm);
