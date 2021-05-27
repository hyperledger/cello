/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { PureComponent, Fragment } from 'react';
import { connect, injectIntl } from 'umi';
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
    const { dispatch } = this.props;

    dispatch({
      type: 'network/clear',
    });
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
          id: 'app.operator.network.table.header.name',
          defaultMessage: 'Network Name',
        }),
        dataIndex: 'name',
      },
      {
        title: intl.formatMessage({
          id: 'app.operator.network.table.header.type',
          defaultMessage: 'Network Type',
        }),
        dataIndex: 'type',
      },
      {
        title: intl.formatMessage({
          id: 'app.operator.network.table.header.version',
          defaultMessage: 'Version',
        }),
        dataIndex: 'version',
      },
      {
        title: intl.formatMessage({
          id: 'app.operator.network.table.header.creationTime',
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
            <a >
              {intl.formatMessage({ id: 'form.menu.item.update', defaultMessage: 'Update' })}
            </a>
            <Divider type="vertical" />
            <a className={styles.danger} >
              {intl.formatMessage({ id: 'form.menu.item.delete', defaultMessage: 'Delete' })}
            </a>
          </Fragment>
        ),
      },
    ];
    return (
      <PageHeaderWrapper
        title={intl.formatMessage({
          id: 'app.operator.network.title',
          defaultMessage: 'Network Management',
        })}
      >
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListOperator}>
              <Button type="primary" >
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
