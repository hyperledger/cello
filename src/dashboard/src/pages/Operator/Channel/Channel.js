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

@connect(({ channel, loading }) => ({
  channel,
  loadingChannels: loading.effects['channel/listChannel'],
}))
class Channel extends PureComponent {
  state = {
    selectedRows: [],
    formValues: {},
  };

  componentDidMount() {
    const { dispatch } = this.props;

    dispatch({
      type: 'channel/listChannel',
    });
  }

  componentWillUnmount() {
    const { dispatch } = this.props;

    dispatch({
      type: 'channel/clear',
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
      type: 'channel/listChannel',
      payload: params,
    });
  };

  render() {
    const { selectedRows } = this.state;
    const {
      channel: { channels, pagination },
      loadingChannels,
      intl,
    } = this.props;
    const columns = [
      {
        title: intl.formatMessage({
          id: 'app.operator.channel.table.header.name',
          defaultMessage: 'Channel Name',
        }),
        dataIndex: 'name',
      },
      {
        title: intl.formatMessage({
          id: 'app.operator.channel.table.header.network',
          defaultMessage: 'Network',
        }),
        render: (text, record) => (record.network.name),
      },
      {
        title: intl.formatMessage({
          id: 'form.table.header.operation',
          defaultMessage: 'Operation',
        }),
        render: (text, record) => (
          <Fragment>
            <a>
              {intl.formatMessage({ id: 'form.menu.item.update', defaultMessage: 'Update' })}
            </a>
            <Divider type="vertical" />
            <a className={styles.danger}>
              {intl.formatMessage({ id: 'form.menu.item.delete', defaultMessage: 'Delete' })}
            </a>
          </Fragment>
        ),
      },
    ];
    return (
      <PageHeaderWrapper
        title={intl.formatMessage({
          id: 'app.operator.channel.title',
          defaultMessage: 'Channel Management',
        })}
      >
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListOperator}>
              <Button type="primary">
                <PlusOutlined />
                {intl.formatMessage({ id: 'form.button.new', defaultMessage: 'New' })}
              </Button>
            </div>
            <StandardTable
              selectedRows={selectedRows}
              loading={loadingChannels}
              rowKey="id"
              data={{
                list: channels,
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

export default injectIntl(Channel);
