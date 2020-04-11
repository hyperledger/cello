import React, { PureComponent, Fragment } from 'react';
import { Pie } from '../../components/Charts';
import {
    Form,
    Card,
    Row,
    Col,
} from 'antd';

import styles from './index.less';
import { connect } from 'dva';
import {defineMessages, IntlProvider} from "react-intl";
import {getLocale} from "../../utils/utils";

const messages = defineMessages({
    channel:{
        id: 'Overview.ChannelOverview.Channel',
        defaultMessage: 'Channel',
    },
    nodePro:{
        id: 'Overview.ChannelOverview.NodeProportion',
        defaultMessage: 'Channel proportions that contain nodes',
    },
    createPro:{
        id: 'Overview.ChannelOverview.CreatePropotion',
        defaultMessage: 'Channel proportion that I created',
    },
});

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

@connect(({ loading }) => ({
    loadingInfo: loading.models.overview,
}))


@Form.create()
export default class ChannelOverview extends PureComponent {

    render() {
        const {
            allCls,
            userCls,
            loadingChannels,
        } = this.props;

        return (
            <div>
                <Card
                    bordered={false}
                >
                    <Fragment>
                        <Row gutter={24}>
                            <Col >
                                <Card
                                    loading={loadingChannels}
                                    className={styles.pieChartCard}
                                    bordered={false}
                                    title={ intl.formatMessage(messages.channel) }
                                    bodyStyle={{ padding: 24 }}
                                    style={{ marginTop: 24, minHeight: 409 }}
                                >
                                    <Row style={{padding: '20px 0'}} gutter={48} >
                                        <Col span={10} xl={12} lg={24} md={24} sm={24} xs={24}>
                                            <h4>{ intl.formatMessage(messages.nodePro) }</h4>
                                            <Pie
                                                hasLegend
                                                subTitle={ intl.formatMessage(messages.channel) }
                                                color={'#722ed1'}
                                                total={() => (
                                                    <span>
                                                        {allCls.reduce((pre, now) => now.y + pre, 0)}
                                                    </span>
                                                )}
                                                data={allCls}
                                                height={200}
                                                lineWidth={1}
                                            />
                                        </Col>
                                        <Col span={10} xl={12} lg={24} md={24} sm={24} xs={24}>
                                            <h4>{ intl.formatMessage(messages.createPro) }</h4>
                                            <Pie
                                                hasLegend
                                                subTitle={ intl.formatMessage(messages.channel) }
                                                total={() => (
                                                    <span>
                                                        {userCls.reduce((pre, now) => now.y + pre, 0)}
                                                    </span>
                                                )}
                                                data={userCls}
                                                height={200}
                                                lineWidth={1}
                                            />
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                        </Row>
                    </Fragment>
                </Card>
            </div>
        );
    }
}
