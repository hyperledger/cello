import React, { useState, useEffect } from 'react';
import { injectIntl, useIntl } from 'umi';
import { Modal, message, Select, Form, Tag, Checkbox } from 'antd';
import StandardTable from '@/components/StandardTable';
// import { listChannel } from '@/services/channel'
import { listOrganization } from '@/services/organization';
// import { listApprovedChaincode } from '@/services/chaincode';
import styles from '../styles.less';

const FormItem = Form.Item;
// const initialState = [
//   { label: 'mychannel1', value: 'mychannel1', disabled: true },
//   { label: 'mychannel2', value: 'mychannel2' },
//   { label: 'mychannel3', value: 'mychannel3' },
// ];

const CommitForm = props => {
  const [form] = Form.useForm();
  const intl = useIntl();
  const [orgs, setOrgs] = useState();
  const [approvedOrgs, setApprovedOrgs] = useState();
  // const [channels, setChannels] = useState();
  const {
    chaincodeName = '',
    commitModalVisible,
    handleCommit,
    handleCommitModalVisible,
    Committing,
    fetchChainCodes,
    selectedRows,
    initFlagChange,
  } = props;

  useEffect(() => {
    async function fecthData() {
      // const channelResponse = await listChannel();
      // setChannels(channelResponse.data.data);
      const orgResponse = await listOrganization();
      setOrgs(orgResponse.data.data);
    }
    fecthData();
  }, []);

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

  const handleChannelChange = () => {
    const filteredOrgs = orgs.map(org => {
      // const response = await listApprovedChaincode({ channels_name: value[0], org_name: org["name"] });
      // const chaincode_names = response.data.chaincode_names;
      const chaincodeNames = [];
      return chaincodeName in chaincodeNames
        ? {
            name: org.name,
            status: 'Approved',
          }
        : {
            name: org.name,
            status: 'Unapproved',
          };
    });
    setApprovedOrgs(filteredOrgs);
  };

  // const dummyList = [
  //   {
  //     name: 'org1.cello.com',
  //     status: 'Approved',
  //   },
  //   {
  //     name: 'org2.cello.com',
  //     status: 'Approved',
  //   },
  //   {
  //     name: 'org3.cello.com',
  //     status: 'Unapproved',
  //   },
  // ];

  const dummyChannel = [
    {
      id: '89cab0f6-47a8-4335-b217-7ec39cfcf65f',
      name: 'channel1',
      network: {
        id: 'bfb3484d-dc5c-4cc4-8be0-0251eefd2c57',
        name: 'test1',
      },
      organizations: [
        {
          id: '76ebf68b-019f-45ff-abef-67e3a3d1752f',
          name: 'org1.cello.com',
        },
      ],
      create_ts: '2021-12-10T05:52:30.931971Z',
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
            // options={channels}
            onChange={handleChannelChange}
            options={dummyChannel.map(c => {
              return {
                value: c.name,
                label: c.name,
              };
            })}
            tagRender={tagRender}
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
          <StandardTable
            selectedRows={selectedRows}
            rowKey="id"
            // data={{
            //   list: chainCodes,
            //   pagination,
            // }}
            data={{
              // list: dummyList,
              list: approvedOrgs,
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
