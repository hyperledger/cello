/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent, Fragment } from 'react';
import { connect, injectIntl, history } from 'umi';
import { Card, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import StandardTable from '@/components/StandardTable';
import styles from './styles.less';
import { useIntl } from "umi";

@connect(({ chainCode, loading }) => ({
  chainCode,
  loadingChainCodes: loading.effects['chainCode/listChainCode'],
}))
class ChainCode extends PureComponent {
  state = {
    selectedRows: [],
    formValues: {},
    modalVisible: false
  };

  componentDidMount() {
    this.fetchChaincodes();
  }

  componentWillUnmount() {
    const { dispatch } = this.props;

    dispatch({
      type: 'chainCode/clear',
    });
  }

  fetchChaincodes = () => {
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
      modalVisible: !!visible
    });
  };

  onUploadChainCode = () => {
    this.handleModalVisible(true);
  };

  render() {
    const { selectedRows } = this.state;
    const {
      chainCode: { chainCodes, pagination },
      loadingChainCodes,
      intl,
    } = this.props;

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
        render: (text, record) => (
          <Fragment>
            <a>
              {intl.formatMessage({ id: 'app.operator.chainCode.table.operate.install', defaultMessage: 'Install' })}
            </a>
            <Divider type="vertical" />
            <a className={styles.danger}>
              {intl.formatMessage({ id: 'app.operator.chainCode.table.operate.delete', defaultMessage: 'Delete' })}
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
      </PageHeaderWrapper>
    );
  }
}

export default injectIntl(ChainCode);
