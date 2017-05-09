/**
 * Created by yuehaitao on 2017/2/7.
 */
import React, { PropTypes } from 'react'
import { Badge, Tag, Button, Modal, Table, Popconfirm, Pagination } from 'antd'
import styles from './ClusterList.less'
import { DropOption } from '../../../components'

const confirm = Modal.confirm

function list({loadingList, dataSource, onDelete, onOperate}) {
    const handleMenuClick = (record, e, index) => {
        const operationKeys = ['release', 'start', 'stop', 'restart']
        if (operationKeys.indexOf(e.key)>=0) {
            onOperate(e.key, record, index);
        } else if (e.key === 'delete') {
            confirm({
                title: 'Confirm to delete?',
                onOk () {
                    onDelete(record, index)
                },
            })
        }
    }
    const loadingText = ["operating"]
    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (text) => {
                let status = "success"
                if (loadingText.indexOf(text) >= 0) {
                    status = "processing"
                } else if (text !== "running") {
                    status = "warning"
                }
                return (
                    <span className={styles.title}><Badge status={status} text={text} /></span>
                )
            }
        },
        {
            title: 'Type',
            dataIndex: 'consensus_plugin',
            key: 'consensus_plugin',
            render: (text) => (
                <span className={styles.title}>{text}</span>
            )
        },
        {
            title: 'Health',
            dataIndex: 'health',
            key: 'health'
        },
        {
            title: 'Size',
            dataIndex: 'size',
            key: 'size'
        },
        {
            title: 'Host',
            dataIndex: 'host_id',
            key: 'host_id'
        },
        {
            title: 'Operation',
            key: 'operation',
            width: 100,
            render: (text, record, index) => {
                const menuOptions = [
                    {key: 'delete', name: 'Delete'},
                    {key: 'release', name: 'Release'},
                    {key: 'stop', name: 'Stop'},
                    {key: 'start', name: 'Start'},
                    {key: 'restart', name: 'Restart'}
                ]
                return <DropOption onMenuClick={e => handleMenuClick(record, e, index)} menuOptions={menuOptions} />
            }
        }
    ]

    return (
        <div>
            <Table
                className={styles.table}
                columns={columns}
                dataSource={dataSource}
                loading={loadingList}
                locale={{
                    emptyText: 'No data'
                }}
                size="small"
                rowKey={record => record.id}
            />
        </div>
    )
}

list.propTypes = {
    loadingList: PropTypes.any,
    dataSource: PropTypes.array,
    pagination: PropTypes.any,
    onPageChange: PropTypes.func,
    onDeleteItem: PropTypes.func,
    onSelectItem: PropTypes.func,
    onSelectTagItem: PropTypes.func
}

export default list