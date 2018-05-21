/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { Component, Fragment } from 'react';
import { connect } from 'dva';
import {
  Row,
  Card,
} from 'antd';

@connect(({ chart, loading }) => ({
  chart,
  loading: loading.effects['chart/fetch'],
}))
export default class Analysis extends Component {

  render() {

    return (
      <Fragment>
        <Row gutter={24}>
          <Card>
            Dashboard
          </Card>
        </Row>
      </Fragment>
    );
  }
}
