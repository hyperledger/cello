import React, { PureComponent } from 'react';
import { Table } from 'antd';
import { injectIntl } from 'umi';
import styles from './index.less';

class PureStandardTable extends PureComponent {
  handleTableChange = (pagination, filters, sorter) => {
    const { onChange } = this.props;
    if (onChange) {
      onChange(pagination, filters, sorter);
    }
  };

  cleanSelectedKeys = () => {
    this.handleRowSelectChange([], []);
  };

  render() {
    const { data = {}, rowKey, intl, ...rest } = this.props;
    const { list = [], pagination } = data;

    const paginationProps = {
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) =>
        intl.formatMessage(
          {
            id: 'component.standardTable.showTotal',
            defaultMessage: '{start}-{end} of {total} items',
          },
          {
            start: range[0],
            end: range[1],
            total,
          }
        ),
      ...pagination,
    };

    return (
      <div className={styles.standardTable}>
        <div className={styles.tableAlert} />
        <Table
          rowKey={rowKey || 'key'}
          dataSource={list}
          pagination={paginationProps}
          onChange={this.handleTableChange}
          {...rest}
        />
      </div>
    );
  }
}

export default injectIntl(PureStandardTable);
