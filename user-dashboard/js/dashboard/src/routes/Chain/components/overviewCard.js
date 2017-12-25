/*
 SPDX-License-Identifier: Apache-2.0
*/
import React from 'react'
import PropTypes from 'prop-types'
import { Card, Icon, Row, Col, Avatar } from 'antd'
import classNames from 'classnames/bind';
import styles from './overviewCard.less'
let cx = classNames.bind(styles);

class OverviewCard extends React.Component {
  constructor (props) {
    super(props)
  }
  render() {
    const {iconType, colorClass, title, number} = this.props;
    const iconBackgroundClass = {}
    iconBackgroundClass[colorClass] = true
    return (
      <Card className={styles.card}>
        <Row gutter={24}>
          <Col span={8}>
            <Avatar size="large" icon={iconType} className={cx(iconBackgroundClass)} />
          </Col>
          <Col span={16} className={styles.cardContent}>
            <h3 className={styles.cardTitle}>{title}</h3>
            <p className={styles.cardNum}>{number}</p>
          </Col>
        </Row>
      </Card>
    )
  }
}

export default OverviewCard
