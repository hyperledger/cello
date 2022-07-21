/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent, Fragment } from 'react';
import { connect, injectIntl, useIntl } from 'umi';
import { Card, Button, Modal, Input, Upload, Divider, message } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import StandardTable from '@/components/StandardTable';
import { Form, Select } from 'antd/lib/index';
import styles from './styles.less';

const FormItem = Form.Item;
const { Option } = Select;

const UploadChainCode = props => {
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
          id: 'app.operator.chainCode.form.create.fail',
          defaultMessage: 'Upload chain code failed',
        })
      );
    } else {
      message.success(
        intl.formatMessage({
          id: 'app.operator.chainCode.form.create.success',
          defaultMessage: 'Upload chain code succeed',
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
      sm: { span: 12 },
      md: { span: 10 },
    },
  };

  const languageOptions = ['golang', 'java', 'nodejs'].map(item => (
    <Option value={item} key={item}>
      <span style={{ color: '#8c8f88' }}>{item}</span>
    </Option>
  ));

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
        id: 'app.operator.chainCode.form.create.header.title',
        defaultMessage: 'Upload Chain code',
      })}
      confirmLoading={uploading}
      visible={modalVisible}
      onOk={onSubmit}
      onCancel={() => handleModalVisible(false)}
    >
      <Form onFinish={onFinish} form={form} preserve={false}>
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.chainCode.form.create.name',
            defaultMessage: 'Name',
          })}
          name="name"
          initialValue=""
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'app.operator.chainCode.form.create.checkName',
                defaultMessage: 'Please enter the chain code name',
              }),
            },
          ]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'app.operator.chainCode.form.create.name',
              defaultMessage: 'Name',
            })}
          />
        </FormItem>
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.chainCode.form.create.version',
            defaultMessage: 'Version',
          })}
          name="version"
          initialValue=""
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'app.operator.chainCode.form.create.checkVersion',
                defaultMessage: 'Please enter the chain code version',
              }),
            },
          ]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'app.operator.chainCode.form.create.version',
              defaultMessage: 'Version',
            })}
          />
        </FormItem>
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.chainCode.form.create.language',
            defaultMessage: 'Language',
          })}
          name="language"
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'app.operator.chainCode.form.create.checkLanguage',
                defaultMessage: 'Please select language',
              }),
            },
          ]}
        >
          <Select>{languageOptions}</Select>
        </FormItem>
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.chainCode.form.create.md5',
            defaultMessage: 'md5',
          })}
          name="md5"
          initialValue=""
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'app.operator.chainCode.form.create.checkMd5',
                defaultMessage: 'Please enter the md5',
              }),
            },
          ]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'app.operator.chainCode.form.create.md5',
              defaultMessage: 'md5',
            })}
          />
        </FormItem>
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.chainCode.form.create.file',
            defaultMessage: 'file',
          })}
          name="file"
          getValueFromEvent={normFile}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'app.operator.chainCode.form.create.fileSelect',
                defaultMessage: 'Please select the chain code file',
              }),
            },
          ]}
        >
          <Upload {...uploadProps}>
            <Button disabled={!!newFile}>
              <UploadOutlined />
              {intl.formatMessage({
                id: 'app.operator.chainCode.form.create.fileSelect',
                defaultMessage: 'Please select the chain code file',
              })}
            </Button>
          </Upload>
        </FormItem>
      </Form>
    </Modal>
  );
};

@connect(({ chainCode, loading }) => ({
  chainCode,
  loadingChainCodes: loading.effects['chainCode/listChainCode'],
  uploading: loading.effects['chainCode/uploadChainCode'],
}))
class ChainCode extends PureComponent {
  state = {
    selectedRows: [],
    formValues: {},
    newFile: '',
    modalVisible: false,
  };

  componentDidMount() {
    this.fetchChainCodes();
  }

  componentWillUnmount() {
    const { dispatch } = this.props;

    dispatch({
      type: 'chainCode/clear',
    });
  }

  fetchChainCodes = () => {
    const { dispatch } = this.props;

    dispatch({
      type: 'chainCode/listChainCode',
    });
  };

  handleTableChange = pagination => {
    const { dispatch } = this.props;
    const { formValues } = this.state;
    const { current, pageSize } = pagination;
    const params = {
      page: current,
      per_page: pageSize,
      ...formValues,
    };
    dispatch({
      type: 'chainCode/listChainCode',
      payload: params,
    });
  };

  handleModalVisible = visible => {
    this.setState({
      modalVisible: !!visible,
    });
  };

  handleUpload = (values, callback) => {
    const { dispatch } = this.props;
    const formData = new FormData();

    Object.keys(values).forEach(key => {
      formData.append(key, values[key]);
    });

    dispatch({
      type: 'chainCode/uploadChainCode',
      payload: formData,
      callback,
    });
  };

  onUploadChainCode = () => {
    this.handleModalVisible(true);
  };

  setFile = file => {
    this.setState({ newFile: file });
  };

  render() {
    const { selectedRows, modalVisible, newFile } = this.state;
    const {
      chainCode: { chainCodes, pagination },
      loadingChainCodes,
      intl,
      uploading,
    } = this.props;

    const formProps = {
      modalVisible,
      handleUpload: this.handleUpload,
      handleModalVisible: this.handleModalVisible,
      fetchChainCodes: this.fetchChainCodes,
      uploading,
      newFile,
      setFile: this.setFile,
      intl,
    };

    const columns = [
      {
        title: intl.formatMessage({
          id: 'app.operator.chainCode.table.header.name',
          defaultMessage: 'Name',
        }),
        dataIndex: 'name',
      },
      {
        title: intl.formatMessage({
          id: 'app.operator.chainCode.table.header.version',
          defaultMessage: 'Version',
        }),
        dataIndex: 'version',
      },
      {
        title: intl.formatMessage({
          id: 'app.operator.chainCode.table.header.language',
          defaultMessage: 'Language',
        }),
        dataIndex: 'language',
      },
      {
        title: intl.formatMessage({
          id: 'app.operator.chainCode.table.header.time',
          defaultMessage: 'Time',
        }),
        dataIndex: 'create_ts',
      },
      {
        title: intl.formatMessage({
          id: 'app.operator.chainCode.table.header.md5',
          defaultMessage: 'MD5',
        }),
        dataIndex: 'md5',
      },
      {
        title: intl.formatMessage({
          id: 'form.table.header.operation',
          defaultMessage: 'Operation',
        }),
        // eslint-disable-next-line no-unused-vars
        render: (text, record) => (
          <Fragment>
            <a>
              {intl.formatMessage({
                id: 'app.operator.chainCode.table.operate.install',
                defaultMessage: 'Install',
              })}
            </a>
            <Divider type="vertical" />
            <a className={styles.danger}>
              {intl.formatMessage({
                id: 'app.operator.chainCode.table.operate.delete',
                defaultMessage: 'Delete',
              })}
            </a>
          </Fragment>
        ),
      },
    ];
    return (
      <PageHeaderWrapper
        title={intl.formatMessage({
          id: 'app.operator.chainCode.title',
          defaultMessage: 'Chain code management',
        })}
      >
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListOperator}>
              <Button type="primary" onClick={this.onUploadChainCode}>
                <PlusOutlined />
                {intl.formatMessage({ id: 'form.button.new', defaultMessage: 'New' })}
              </Button>
            </div>
            <StandardTable
              selectedRows={selectedRows}
              loading={loadingChainCodes}
              rowKey="id"
              data={{
                list: chainCodes,
                pagination,
              }}
              columns={columns}
              onSelectRow={this.handleSelectRows}
              onChange={this.handleTableChange}
            />
          </div>
        </Card>
        <UploadChainCode {...formProps} />
      </PageHeaderWrapper>
    );
  }
}

export default injectIntl(ChainCode);
