/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent, Fragment } from 'react';
import { connect, injectIntl, history } from 'umi';
import { Card, Button, Modal, message, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import moment from 'moment';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import StandardTable from '@/components/StandardTable';
import styles from './styles.less';

@connect(({ network, loading }) => ({
  network,
  loadingNetworks: loading.effects['network/listNetwork'],
}))
class Network extends PureComponent {
  state = {
    selectedRows: [],
    formValues: {},
  };

  componentDidMount() {
    const { dispatch } = this.props;

    dispatch({
      type: 'network/listNetwork',
    });
  }

  componentWillUnmount() {
    this.queryNetworkList();
  }

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
      type: 'network/listNetwork',
      payload: params,
    });
  };

  newNetwork = () => {
    history.push('/network/newNetwork');
  };

  queryNetworkList = () => {
    const { dispatch } = this.props;

    dispatch({
      type: 'network/listNetwork',
    });
  };

  handleDeleteNetwork = row => {
    const { dispatch, intl } = this.props;
    const { deleteCallBack } = this;
    const { id } = row;

    Modal.confirm({
      title: intl.formatMessage({
        id: 'app.network.form.delete.title',
        defaultMessage: 'Delete Network',
      }),
      content: intl.formatMessage(
        {
          id: 'app.network.form.delete.content',
          defaultMessage: 'Confirm to delete network {name}?',
        },
        {
          name: row.name,
        }
      ),
      okText: intl.formatMessage({ id: 'form.button.confirm', defaultMessage: 'Confirm' }),
      cancelText: intl.formatMessage({ id: 'form.button.cancel', defaultMessage: 'Cancel' }),
      onOk() {
        dispatch({
          type: 'network/deleteNetwork',
          payload: id,
          callback: deleteCallBack,
        });
      },
    });
  };

  deleteCallBack = response => {
    const { intl } = this.props;
    if (response.status === 'successful') {
      message.success(
        intl.formatMessage({
          id: 'app.network.delete.success',
          defaultMessage: 'Delete Network success.',
        })
      );
      this.queryNetworkList();
    } else {
      message.error(
        intl.formatMessage({
          id: 'app.network.delete.fail',
          defaultMessage: 'Delete Network failed.',
        })
      );
    }
  };

  render() {
    const { selectedRows } = this.state;
    const {
      network: { networks, pagination },
      loadingNetworks,
      intl,
    } = this.props;
    const columns = [
      {
        title: intl.formatMessage({
          id: 'app.network.table.header.name',
          defaultMessage: 'Network Name',
        }),
        dataIndex: 'name',
      },
      {
        title: intl.formatMessage({
          id: 'app.network.table.header.creationTime',
          defaultMessage: 'Create Time',
        }),
        dataIndex: 'created_at',
        render: text => <span>{moment(text).format('YYYY-MM-DD HH:mm:ss')}</span>,
      },
      {
        title: intl.formatMessage({
          id: 'form.table.header.operation',
          defaultMessage: 'Operation',
        }),
        render: (text, record) => (
          <Fragment>
            <a>{intl.formatMessage({ id: 'form.menu.item.update', defaultMessage: 'Update' })}</a>
            <Divider type="vertical" />
            <a className={styles.danger} onClick={() => this.handleDeleteNetwork(record)}>
              {intl.formatMessage({ id: 'form.menu.item.delete', defaultMessage: 'Delete' })}
            </a>
          </Fragment>
        ),
      },
    ];
    return (
      <PageHeaderWrapper
        title={intl.formatMessage({
          id: 'app.network.title',
          defaultMessage: 'Network Management',
        })}
      >
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListOperator}>
              <Button type="primary" onClick={() => this.newNetwork()}>
                <PlusOutlined />
                {intl.formatMessage({ id: 'form.button.new', defaultMessage: 'New' })}
              </Button>
            </div>
            <StandardTable
              selectedRows={selectedRows}
              loading={loadingNetworks}
              rowKey="id"
              data={{
                list: networks,
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

export default injectIntl(Network);
