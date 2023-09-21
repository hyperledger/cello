import React from 'react';
import { injectIntl, useIntl } from 'umi';
import { Modal, message, Select, Form, Tag, Checkbox } from 'antd';
import PureStandardTable from '@/components/PureStandardTable';
import styles from '../styles.less';

const FormItem = Form.Item;
const nodes = [
  { label: 'mychannel1', value: 'mychannel1', disabled: true },
  { label: 'mychannel2', value: 'mychannel2' },
  { label: 'mychannel3', value: 'mychannel3' },
];

const CommitForm = props => {
  const [form] = Form.useForm();
  const intl = useIntl();
  const {
    commitModalVisible,
    handleCommit,
    handleCommitModalVisible,
    Committing,
    fetchChainCodes,
    selectedRows,
    loadingOrgs,
    initFlagChange,
  } = props;

  const commitCallback = response => {
    if (response.status !== 'successful') {
      message.error(
        intl.formatMessage({
          id: 'app.operator.chainCode.form.commit.fail',
          defaultMessage: 'Commit chaincode failed',
        })
      );
    } else {
      message.success(
        intl.formatMessage({
          id: 'app.operator.chainCode.form.commit.success',
          defaultMessage: 'Commit chaincode succeed',
        })
      );
      form.resetFields();
      handleCommitModalVisible();
      fetchChainCodes();
    }
  };

  const onSubmit = () => {
    form.submit();
  };

  const onFinish = values => {
    handleCommit(values, commitCallback);
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

  const handleTableChange = pagination => {
    const { dispatch } = props;
    const { current, pageSize } = pagination;
    const params = {
      page: current,
      per_page: pageSize,
    };
    dispatch({
      type: 'chainCode/listChainCode',
      payload: params,
    });
  };

  const dummyList = [
    {
      name: 'org1.cello.com',
      status: 'Approved',
    },
    {
      name: 'org2.cello.com',
      status: 'Approved',
    },
    {
      name: 'org3.cello.com',
      status: 'Unapproved',
    },
  ];

  const dummyPagination = {
    total: 0,
    current: 1,
    pageSize: 10,
  };

  const columns = [
    {
      title: intl.formatMessage({
        id: 'app.operator.chainCode.form.commit.header.name',
        defaultMessage: 'Organization Name',
      }),
      dataIndex: 'name',
    },
    {
      title: intl.formatMessage({
        id: 'app.operator.chainCode.form.commit.header.status',
        defaultMessage: 'Approvement Status',
      }),
      dataIndex: 'status',
    },
  ];

  return (
    <Modal
      destroyOnClose
      title={intl.formatMessage({
        id: 'app.operator.chainCode.form.commit.header.title',
        defaultMessage: 'Commit Chaincode',
      })}
      confirmLoading={Committing}
      open={commitModalVisible}
      onOk={onSubmit}
      onCancel={() => handleCommitModalVisible(false)}
    >
      <Form onFinish={onFinish} form={form} preserve={false}>
        <FormItem
          {...formItemLayout}
          label={intl.formatMessage({
            id: 'app.operator.chainCode.form.commit.channels',
            defaultMessage: 'Please select channels',
          })}
          name="channels"
        >
          <Select
            mode="multiple"
            options={nodes}
            tagRender={tagRender}
            defaultValue={['mychannel1']}
            dropdownClassName={styles.dropdownClassName}
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
        <div className={styles.tableList}>
          <PureStandardTable
            selectedRows={selectedRows}
            loading={loadingOrgs}
            rowKey="id"
            // data={{
            //   list: chainCodes,
            //   pagination,
            // }}
            data={{
              list: dummyList,
              pagination: dummyPagination,
            }}
            columns={columns}
            onChange={handleTableChange}
          />
        </div>
      </Form>
    </Modal>
  );
};

export default injectIntl(CommitForm);
