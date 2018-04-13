/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { Component, Fragment } from 'react';
import { Row, Col } from 'antd';
import { defineMessages, FormattedMessage } from 'react-intl';

const messages = defineMessages({
  title: {
    id: 'Home',
    defaultMessage: 'Home',
  },
});

export default class Analysis extends Component {
  render() {
    const topColResponsiveProps = {
      xs: 24,
      sm: 12,
      md: 12,
      lg: 12,
      xl: 6,
      style: { marginBottom: 24 },
    };

    return (
      <Fragment>
        <Row gutter={24}>
          <Col {...topColResponsiveProps}>
            Overview2
            <br />
            <FormattedMessage {...messages.title} />
          </Col>
        </Row>
      </Fragment>
    );
  }
}
