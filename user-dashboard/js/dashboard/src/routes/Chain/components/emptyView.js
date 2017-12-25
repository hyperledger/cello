/*
 SPDX-License-Identifier: Apache-2.0
*/
import React from 'react'
import { Row, Col, Icon, Button, Card } from 'antd'
import { injectIntl, intlShape, defineMessages, FormattedMessage} from 'react-intl';

const messages = defineMessages({
  title: {
    id: "Chain.EmptyView.Title",
    defaultMessage: "You did not add any block chains"
  },
  content: {
    id: "Chain.EmptyView.Content",
    defaultMessage: "Speed, free, stable, and so what, hurry up to apply it"
  },
  applyButton: {
    id: "Chain.EmptyView.ApplyButton",
    defaultMessage: "Apply Now"
  }
})

function EmptyView ({ onClickButton }) {

  return (
    <Card bordered={false}>
    <Row type="flex" justify="space-around" align="middle">
      <Col span={8} style={{textAlign: "center"}}>
        <Row>
          <Icon type="copy" style={{fontSize: 120}} />
        </Row>
        <Row>
          <p style={{fontSize: 18, fontWeight: "bold", marginTop: 20}}><FormattedMessage {...messages.title} /></p>
          <p style={{marginTop: 15}}><FormattedMessage {...messages.content} /></p>
        </Row>
        <Row>
          <Button onClick={onClickButton} type="primary" style={{marginTop: 20}}><FormattedMessage {...messages.applyButton} /></Button>
        </Row>
      </Col>
    </Row>
    </Card>
  )
}

export default EmptyView
