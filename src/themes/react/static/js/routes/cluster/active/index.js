/**
 * Created by yuehaitao on 2017/4/4.
 */
import React, {PropTypes} from 'react'
import { connect } from 'dva'
import ClusterList from './ClusterList'
import ClusterModal from './ClusterModal'
import {Row, Col, Button} from 'antd'
import FilterForm from './FilterForm'

function index({cluster, host, dispatch}) {
	const {loading, activeClusters, clusters, modalVisible, filter} = cluster
	const {hosts} = host
    function filterClusters(item, index, array) {
		if (filter === 'inuse') {
			return (item.user_id !== '')
		} else {
			return true
		}
    }
    const filteredClusters = clusters.filter(filterClusters)
	const listProps = {
		loading,
		dataSource: filteredClusters,
		onDelete(record, index) {
			dispatch({
				type: 'cluster/deleteCluster',
				payload: {
					id: record.id,
					col_name: "active"
				}
			})
		},
		onOperate(action, record, index) {
			dispatch({
				type: 'cluster/operation',
				payload: {
					action,
					cluster_id: record.id
				}
			})
		}
	}
	function addChain() {
		dispatch({
			type: 'cluster/showModal'
		})
    }
    const modalProps = {
		visible: modalVisible,
		hosts,
		onOk(data) {
			dispatch({
				type: 'cluster/create',
				payload: data
			})
		},
		onCancel() {
			dispatch({
				type: 'cluster/hideModal'
			})
		}
	}
	const ModalGen = () => <ClusterModal {...modalProps}/>
    const filterOptions = {
    	filterValue: filter,
		onFilterChange(value) {
    		dispatch({
				type: 'cluster/changeFilter',
				payload: {
					filter: value
				}
			})
		}
	}
	return (
		<div className="content-inner">
			<Row style={{marginBottom: 20}}>
				<Col span={12}>
					<FilterForm {...filterOptions}/>
				</Col>
				<Col span={12} style={{textAlign: 'right'}}>
					<Button type="primary" onClick={addChain}>Add Chain</Button>
				</Col>
			</Row>
            <ClusterList {...listProps}/>
			<ModalGen/>
        </div>
	)
}

export default connect(({ cluster, host }) => ({ cluster, host }))(index)


