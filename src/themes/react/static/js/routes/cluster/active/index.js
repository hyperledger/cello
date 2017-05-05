/**
 * Created by yuehaitao on 2017/4/4.
 */
import React, {PropTypes} from 'react'
import { connect } from 'dva'
import ClusterList from './ClusterList'
import ClusterModal from './ClusterModal'
import {Row, Col, Button} from 'antd'

function index({cluster, host, dispatch}) {
	const {loading, activeClusters, clusters, modalVisible} = cluster
	const {hosts} = host
	const listProps = {
		loading,
		dataSource: clusters,
		onDelete(record, index) {
			console.log(record, index)
			dispatch({
				type: 'cluster/deleteCluster',
				payload: {
					id: record.id,
					col_name: "active"
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
	return (
		<div className="content-inner">
			<Row style={{marginBottom: 20}}>
				<Col span={24} style={{textAlign: 'right'}}>
					<Button type="primary" onClick={addChain}>Add Chain</Button>
				</Col>
			</Row>
            <ClusterList {...listProps}/>
			<ModalGen/>
        </div>
	)
}

export default connect(({ cluster, host }) => ({ cluster, host }))(index)


