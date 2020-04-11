import React, { PureComponent, Fragment } from 'react';
import { Table, Alert } from 'antd';
import styles from './index.less';

function initTotalList(columns) {
const totalList = [];
columns.forEach(column => {
    if (column.needTotal) {
        totalList.push({ ...column, total: 0 });
    }
});
return totalList;
}

class StandardTableInstantList extends PureComponent {
constructor(props) {
    super(props);
    const { columns } = props;
    const needTotalList = initTotalList(columns);

    this.state = {
        selectedRowKeys: [],
        needTotalList,
        disable:false,
    };
}

/*componentWillReceiveProps(nextProps) {
  // clean state
  if (nextProps.selectedRows.length === 0) {
    const needTotalList = initTotalList(nextProps.columns);
    this.setState({
      selectedRowKeys: [],
      needTotalList,
    });
  }
}  */

handleRowSelectChange = (selectedRowKeys, selectedRows) => {
    const { needTotalList: list } = this.state;
    const { onSelectRow } = this.props;
    let needTotalList = [...list];
    needTotalList = needTotalList.map(item => {
        return {
            ...item,
            total: selectedRows.reduce((sum, val) => {
                return sum + parseFloat(val[item.dataIndex], 10);
            }, 0),
        };
    });

    if (onSelectRow) {
        onSelectRow(selectedRows);
    }

    this.setState({ selectedRowKeys, needTotalList });
};

/* handleTableChange = (pagination, filters, sorter) => {
   const { onChange } = this.props;
   onChange(pagination, filters, sorter);
 };  */


render() {
    const { selectedRowKeys } = this.state;
    const {
        data: {Instants},
        loading,
        columns,
        rowKey,
        select
    } = this.props;

    const rowRadioSelection={

        selectedRowKeys,

        type:'radio',

        columnTitle:select,

        onChange: this.handleRowSelectChange,

        onSelect: (selectedRowKeys, selectedRows) => {

            console.log(selectedRowKeys, selectedRows)

        },

    };


  /*  const rowSelection = {
        selectedRowKeys,
        onChange: this.handleRowSelectChange,
        getCheckboxProps: record => ({
            disabled: record.disabled,
        }),

    };  */

    return (
        <div className={styles.standardTable}>
            <Table
                loading={loading}
                rowKey={rowKey || 'key'}
                rowSelection={rowRadioSelection}
                dataSource={Instants}
                columns={columns}
                onChange={this.handleTableChange}
            />
        </div>
    );
}
}

export default StandardTableInstantList;
