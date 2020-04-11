import React, { PureComponent } from 'react';
import { Table } from 'antd';
import styles from './index.less';

class StandardTableForNetWork extends PureComponent {
    constructor(props) {
        super(props);
        
        this.state = {
        };
    }
    
    componentWillReceiveProps() {
    
    }
    
    handleTableChange = (pagination, filters, sorter) => {
        const { onChange } = this.props;
        onChange(pagination, filters, sorter);
    };
    
    render() {
        const {
            data: {list} ,
            loading,
            columns,
            rowKey,
        } = this.props;
        
        const paginationProps = {
            showSizeChanger: true,
            showQuickJumper: true,
        };
        
        return (
            <div className={styles.standardTable}>
                
                <Table
                    loading={loading}
                    rowKey={rowKey || 'key'}
                    dataSource={list}
                    columns={columns}
                    pagination={paginationProps}
                    onChange={this.handleTableChange}
                />
            </div>
        );
    }
}

export default StandardTableForNetWork;
