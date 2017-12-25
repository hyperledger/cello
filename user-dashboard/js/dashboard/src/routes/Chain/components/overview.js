/*
 SPDX-License-Identifier: Apache-2.0
*/
import React from 'react'
import { Row, Col, Icon, Button, Tooltip } from 'antd'
import {
  ChartCard
} from '../../../components/Charts'
import { injectIntl, intlShape, defineMessages, FormattedMessage} from 'react-intl';
import messages from './overviewMessages'

class Overview extends React.Component {
  constructor (props) {
    super(props)
  }
  render() {
    const {chain, intl, channelHeight} = this.props;
    const topColResponsiveProps = {
      xs: 24,
      sm: 12,
      md: 12,
      lg: 12,
      xl: 6,
      style: { marginBottom: 24 },
    };
    return (
      <div>
        <Row gutter={24}>
          <Col {...topColResponsiveProps}>
            <ChartCard
              bordered={false}
              title={intl.formatMessage(messages.title.peer)}
              action={<Tooltip title={intl.formatMessage(messages.help.peer)}><Icon type="info-circle-o" /></Tooltip>}
              total={chain ? chain.peerNum || 0 : 0}
              contentHeight={46}
            />
          </Col>
          <Col {...topColResponsiveProps}>
            <ChartCard
              bordered={false}
              title={intl.formatMessage(messages.title.block)}
              action={<Tooltip title={intl.formatMessage(messages.help.block)}><Icon type="info-circle-o" /></Tooltip>}
              total={chain ? chain.blocks || 0 : 0}
              contentHeight={46}
            />
          </Col>
          <Col {...topColResponsiveProps}>
            <ChartCard
              bordered={false}
              title={intl.formatMessage(messages.title.smartContract)}
              action={<Tooltip title={intl.formatMessage(messages.help.smartContract)}><Icon type="info-circle-o" /></Tooltip>}
              total={chain ? chain.scNum || 0 : 0}
              contentHeight={46}
            />
          </Col>
          <Col {...topColResponsiveProps}>
            <ChartCard
              bordered={false}
              title={intl.formatMessage(messages.title.transaction)}
              action={<Tooltip title={intl.formatMessage(messages.help.transaction)}><Icon type="info-circle-o" /></Tooltip>}
              total={chain ? chain.transactionNum || 0 : 0}
              contentHeight={46}
            />
          </Col>
        </Row>
      </div>
    )
  }
}

export default injectIntl(Overview)
