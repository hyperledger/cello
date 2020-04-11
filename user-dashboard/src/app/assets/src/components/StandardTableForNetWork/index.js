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
            data: {blockchain_networks} ,
            loading,
            columns,
            rowKey,
        } = this.props;
        
        const paginationProps = {
            showSizeChanger: true,
            showQuickJumper: true,
        };
        console.log(blockchain_networks);
        
        return (
            <div className={styles.standardTable}>
                
                <Table
                    loading={loading}
                    rowKey={rowKey || 'key'}
                    dataSource={blockchain_networks}
                    columns={columns}
                    pagination={paginationProps}
                    onChange={this.handleTableChange}
                />
            </div>
        );
    }
}

export default StandardTableForNetWork;
