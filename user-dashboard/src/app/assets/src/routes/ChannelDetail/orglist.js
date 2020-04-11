import React, { PureComponent, Fragment } from 'react';
import { routerRedux } from 'dva/router';
import {
    Form,
    Card,
    Button,
    Table,
} from 'antd';
import { stringify } from 'qs';
import styles from './ChannelDetail.less';
import { connect } from 'dva';
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from "../../utils/utils";

const messages = defineMessages({
    pageTitle: {
        id: 'Channel.Detail.OrgList.pageTitle',
        defaultMessage: 'Peer Organization List',
    },
    colName: {
        id: 'Channel.Detail.OrgList.colOrgName',
        defaultMessage: 'Organization Name',
    },
    colID: {
        id: 'Channel.Detail.OrgList.colID',
        defaultMessage: 'Organization ID',
    },
    buttonBack: {
        id: 'Channel.Detail.OrgList.buttonBack',
        defaultMessage: 'Back',
    },
    buttonAdd: {
        id: 'Channel.Detail.OrgList.buttonAdd',
        defaultMessage: 'Additional Organization',
    },
});

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

@connect(({ ChannelDetail, ChannelList, loading }) => ({
    ChannelDetail,
    loadingInfo: loading.models.ChannelDetail,
}))


@Form.create()
export default class OrgList extends PureComponent {
    
    clickCancel = () => {
        const { dispatch} = this.props;
        dispatch(
            routerRedux.push({
                pathname: 'ChannelList',
            })
        );
    };
    
    onAddOrg = () =>{
        const { dispatch} = this.props;
        const {
            channelId
        } = this.props;
        dispatch(
            routerRedux.push({
                pathname: 'OrgExpand',
                search: stringify({
                    id: channelId
                }),
            })
        )
    };
    
    
    render() {
        const {
            orgs,
            loadingInfo,
        } = this.props;
        
        
        const deployColumns = [
            {
                title: intl.formatMessage(messages.colName),
                dataIndex: 'org_name', // 'orgName',   ||
                key: 'orgName',
                width: 500,
                /*  render: text => text.name, */
            },
            {
                title: intl.formatMessage(messages.colID),
                dataIndex: 'org_id',
                key: 'orgID',
                /*  render: text => text.name, */
            },
            /*  {
                  title: '组织类型',
                  dataIndex: 'orgRole',
                  key: 'orgRole',
                     render: text => text.version,
              },  */
        ];
        return (
            <div>
                <Card
                    title={intl.formatMessage(messages.pageTitle)}
                    bordered={false}
                >
                    <div className={styles.tableList}>
                        <Table
                            pagination={false}
                            columns={deployColumns}
                            loading={loadingInfo}
                            dataSource={orgs}
                        />
                    </div>
                    <Button icon="rollback" type="primary" style={{ marginTop: 20 }} onClick={this.clickCancel}>
                        {intl.formatMessage(messages.buttonBack)}
                    </Button>
                    <Button icon="plus" type="primary" style={{ marginLeft: 8 }} onClick={this.onAddOrg}>
                        {intl.formatMessage(messages.buttonAdd)}
                    </Button>
                </Card>
            </div>
        );
    }
}
