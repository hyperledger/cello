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
      const {host: {loadingHosts, hosts, modalVisible, modalType, currentItem}, dispatch} = this.props;
      const hostsListProps = {
          dataSource: hosts,
          loadingList: loadingHosts
      }
      const modalProps = {
          item: modalType === 'create' ? {} : currentItem,
          type: modalType,
          visible: modalVisible,
          onOk(data) {
              console.log(data)
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
