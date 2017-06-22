
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by yuehaitao on 2017/2/7.
 */
import React, { PropTypes } from 'react'
import { Badge, Tag, Button, Modal, Table, Popconfirm, Pagination } from 'antd'
import styles from './HostList.less'
import { DropOption } from '../../components'

const confirm = Modal.confirm

function list({loadingList, dataSource, onDelete, onEdit, onOperation}) {
    const handleMenuClick = (record, e, index) => {
        if (e.key === 'edit') {
            onEdit(record)
        } else if (e.key === 'delete') {
            confirm({
                title: 'Confirm to delete?',
                onOk () {
                    onDelete(record, index)
                },
            })
        } else {
            if (e.key === 'reset') {
                confirm({
                    title: 'Want to reset?',
                    content: <div><p>you are about to <span style={{color: 'red'}}>reset</span> the host node1, this procedure is irreversible.</p></div>,
                    okText: 'Confirm',
                    cancelText: 'Cancel',
                    onOk () {
                        onOperation(record, e.key)
                    },
                })
            } else {
                onOperation(record, e.key)
            }
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
                } else if (text !== "active") {
                    status = "warning"
                }
                return (
                    <span><Badge status={status} text={text} /></span>
                )
            }
        },
        {
            title: 'Capacity',
            dataIndex: 'capacity',
            key: 'capacity'
        },
        {
            title: 'Chains',
            dataIndex: 'clusters',
            key: 'clusters',
            render: (text) => (
                <span>{text.length}</span>
            )
        },
        {
            title: 'Create Time',
            dataIndex: 'create_ts',
            key: 'create_ts'
        },
        {
            title: 'Log Level',
            dataIndex: 'log_level',
            key: 'log_level'
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type'
        },
        {
            title: 'Log Type',
            dataIndex: 'log_type',
            key: 'log_type'
        },
        {
            title: 'Operation',
            key: 'operation',
            width: 100,
            render: (text, record, index) => {
                const menuOptions = [
                    {key: 'edit', name: 'Edit'},
                    {key: 'delete', name: 'Delete'},
                    {key: 'fillup', name: 'Fill Up'},
                    {key: 'clean', name: 'Clean'},
                    {key: 'reset', name: 'Reset'}
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