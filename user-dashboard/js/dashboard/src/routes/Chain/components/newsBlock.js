/*
 SPDX-License-Identifier: Apache-2.0
 */
import React from 'react'
import PropTypes from 'prop-types'
import styles from './cardView.less'
import { Table, Divider, Icon, Card } from 'antd';
import { connect } from 'dva';
import moment from "moment"
import { Modal, Button } from 'antd';
import messages from './messages'

import { injectIntl, intlShape, defineMessages, FormattedMessage} from 'react-intl';
@connect(state => ({
  chain:state.chain,
  recentBlocks : state.recentBlocks,
}))

class NewsBlock extends React.Component {
  constructor (props) {
    super(props)
  }
  bitDetail = (recode, index) => {
    const { id } = recode;
    const { dispatch } = this.props;
    let chainId = window.localStorage.getItem(`${window.apikey}-chainId`)
    dispatch({
      type: 'chain/queryByBlockId',
      payload: {
        id : id,
        chainId:chainId
      }
    })
  }

  clickHash = (blockItem) => {
    const {onClickBlockHash} = this.props;
    onClickBlockHash(blockItem)
  }

  render() {
    const {recentBlocks: { recentBlocks } , loadingRecentBlocks}= this.props.chain;
    const {intl} = this.props;
    const columns = [
            {
                title: 'ID',
                key: 'id',
                dataIndex: 'id',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a.id - b.id
            },
            {
                title: 'Hash',
                key: 'hash',
                dataIndex: 'hash',
                width:'200px',
                render: (text, record) => (
                  <a style={{width:'200px',display:'inline-block'}} className={styles.link} onClick={() => this.clickHash(record)}>{text}</a>
                )
            },
            {
                title:intl.formatMessage(messages.blockChain.transactions) ,
                dataIndex: 'transactions',
                key: 'transactions',
            },
            {
                title: intl.formatMessage(messages.blockChain.generationTime),
                dataIndex: 'timestamp',
                key: 'timestamp',
                render: (text, record) => (
                    <span>
                        {moment(text).format('YYYY-MM-DD HH:mm:ss')}
                    </span>
                ),
                defaultSortOrder: 'descend',
                sorter: (a, b) => moment(a.timestamp).unix() - moment(b.timestamp).unix()
            }
        ];

    return (
        <Card title={intl.formatMessage(messages.blockChain.title)} bordered={false} className={styles.cardBody} style={{ width: "100%"}}>
          <Table
            scroll={{ y: 420 }}
            loading={loadingRecentBlocks}
            bordered={false}
            columns={columns}
            dataSource={recentBlocks}
            pagination={false}
          />
        </Card>
    )
  }
}

export default injectIntl(NewsBlock)
