
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'
import HostsList from './HostList'
import HostModal from './HostModal'
import {Row, Col, Button} from 'antd'
import { connect } from 'dva'

class Hosts extends React.Component {
  constructor(props) {
    super(props)
  }
  addHost() {
      const {dispatch} = this.props
      dispatch({
          type: 'host/showModal',
          payload: {
              modalType: 'create'
          }
      })
  }
  render() {
      const {host: {loadingHosts, hosts, modalVisible, modalType, currentHost}, dispatch} = this.props;
      const hostsListProps = {
          dataSource: hosts,
          loadingList: loadingHosts,
          onDelete(record, index) {
              dispatch({
                  type: 'host/deleteHost',
                  payload: {
                      id: record.id,
                      index
                  }
              })
          },
          onEdit(record) {
              dispatch({
                  type: 'host/showModal',
                  payload: {
                      modalType: 'update',
                      currentHost: record
                  }
              })
          },
          onOperation(record, operation) {
              dispatch({
                  type: 'host/opHost',
                  payload: {
                      id: record.id,
                      action: operation
                  }
              })
          }
      }
      const modalProps = {
          item: modalType === 'create' ? {} : currentHost,
          type: modalType,
          visible: modalVisible,
          onOk(data) {
              if (modalType === 'create') {
                  dispatch({
                      type: 'host/createHost',
                      payload: data

                  })
              } else {
                  dispatch({
                      type: 'host/updateHost',
                      payload: data

                  })
              }
          },
          onCancel() {
              dispatch({
                  type: 'host/hideModal'
              })
          }
      }
      const ModalGen = () => <HostModal {...modalProps} />
    return (
        <div className="content-inner">
            <Row style={{marginBottom: 20}}>
                <Col span={24} style={{textAlign: 'right'}}>
                    <Button type="primary" onClick={this.addHost.bind(this)}>Add Host</Button>
                </Col>
            </Row>
            <HostsList {...hostsListProps} />
            <ModalGen/>
        </div>
    )
  }
}

export default connect(({host}) => ({host}))(Hosts)
