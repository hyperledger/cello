import React, { PropTypes } from 'react'
import { connect } from 'dva'
import { Row, Col, Spin } from 'antd'
import ChartCard from './ChartCard'

function Overview({dispatch, overview}) {
    const {loading, host, name, cluster} = overview
    const hostStatusProps = {
        chartId: 'host_status',
        title: 'Host Status',
        data: host.status,
        loading: loading
    }
    const hostTypeProps = {
        chartId: 'host_type',
        title: 'Host Type',
        data: host.type,
        loading: loading
    }
    const clusterStatusProps = {
        chartId: 'cluster_status',
        title: 'Cluster Status',
        data: cluster.status,
        loading: loading
    }
    const clusterTypeProps = {
        chartId: 'cluster_type',
        title: 'Cluster Type',
        data: cluster.type,
        loading: loading
    }

    return (
        <div>
            <Row gutter={16}>
                <Col span={6}>
                    <ChartCard {...hostStatusProps}/>
                </Col>
                <Col span={6}>
                    <ChartCard {...hostTypeProps}/>
                </Col>
                <Col span={6}>
                    <ChartCard {...clusterStatusProps}/>
                </Col>
                <Col span={6}>
                    <ChartCard {...clusterTypeProps}/>
                </Col>
            </Row>
        </div>
    )
}

Overview.propTypes = {
    dispatch: PropTypes.func,
    overview: PropTypes.object
}

function mapStateToProps({overview}) {
    return {overview}
}

export default connect(mapStateToProps)(Overview)
