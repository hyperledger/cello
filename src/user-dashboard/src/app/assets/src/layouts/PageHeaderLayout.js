/*
 SPDX-License-Identifier: Apache-2.0
*/
import React from "react";
import { Link } from "dva/router";
import { Spin } from "antd";
import PageHeader from "../components/PageHeader";
import styles from "./PageHeaderLayout.less";

export default ({ children, loading, wrapperClassName, top, ...restProps }) => (
  <Spin spinning={loading || false}>
    <div style={{ margin: "-24px -24px 0" }} className={wrapperClassName}>
      {top}
      <PageHeader key="pageheader" {...restProps} linkElement={Link} />
      {children ? <div className={styles.content}>{children}</div> : null}
    </div>
  </Spin>
);
