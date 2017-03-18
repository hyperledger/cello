import React from 'react'
import HostsList from '../components/hosts/list'
import { connect } from 'dva'

class Hosts extends React.Component {
  constructor(props) {
    super(props)
  }
  render() {
      const {host: {loadingHosts, hosts}} = this.props;
      const hostsListProps = {
          dataSource: hosts,
          loadingList: loadingHosts
      }
    return (
        <div className="content-inner">
          <HostsList {...hostsListProps} />
        </div>
    )
  }
}

export default connect(({host}) => ({host}))(Hosts)
