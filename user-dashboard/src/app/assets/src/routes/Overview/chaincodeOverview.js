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
    chainCode:{
        id: 'Overview.ChaincodeOverview.ChainCode',
        defaultMessage: 'Chain Code',
    },
    uploadPro:{
        id: 'Overview.ChaincodeOverview.UploadCCPro',
        defaultMessage: 'Upload Chain Code Proportion',
    },
    upload:{
        id: 'Overview.ChaincodeOverview.UploadCC',
        defaultMessage: 'Upload Chain Code',
    },
    installPro:{
        id: 'Overview.ChaincodeOverview.InstallCCPro',
        defaultMessage: 'Install Chain Code Proportion',
    },
    install:{
        id: 'Overview.ChaincodeOverview.InstallCC',
        defaultMessage: 'Install Chain Code',
    },
    instancePro:{
        id: 'Overview.ChaincodeOverview.InstanceCCPro',
        defaultMessage: 'Instantiate Chain Code Proportion',
    },
    instance:{
        id: 'Overview.ChaincodeOverview.InstanceCC',
        defaultMessage: 'Instantiate Chain Code',
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
export default class ChaincodeOverview extends PureComponent {

    render() {
        const {
            instantCcs,
            UploadCcs,
            installCcs,
            loadingChainCodes,
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
                                    loading={loadingChainCodes}
                                    className={styles.pieChartCard}
                                    bordered={false}
                                    title={ intl.formatMessage(messages.chainCode) }
                                    bodyStyle={{ padding: 24 }}
                                    style={{ marginTop: 24, minHeight: 409 }}
                                >
                                    <Row style={{padding: '20px 0'}} gutter={48} >
                                        <Col span={10} xl={12} lg={24} md={24} sm={24} xs={24}>
                                            <h4>{ intl.formatMessage(messages.uploadPro) }</h4>
                                            <Pie
                                                hasLegend
                                                subTitle={ intl.formatMessage(messages.upload) }
                                                color={'#722ed1'}
                                                total={() => (
                                                    <span>
                                                        {UploadCcs.reduce((pre, now) => now.y + pre, 0)}
                                                    </span>
                                                )}
                                                data={UploadCcs}
                                                height={200}
                                                lineWidth={1}
                                            />
                                        </Col>
                                        <Col span={10} xl={12} lg={24} md={24} sm={24} xs={24}>
                                            <h4>{ intl.formatMessage(messages.installPro) }</h4>
                                            <Pie
                                                hasLegend
                                                subTitle={ intl.formatMessage(messages.install) }
                                                total={() => (
                                                    <span>
                                                        {installCcs.reduce((pre, now) => now.y + pre, 0)}
                                                    </span>
                                                )}
                                                data={installCcs}
                                                height={200}
                                                lineWidth={1}
                                            />
                                        </Col>
                                        <Col span={10} xl={12} lg={24} md={24} sm={24} xs={24}>
                                            <h4>{ intl.formatMessage(messages.instancePro) }</h4>
                                            <Pie
                                                hasLegend
                                                subTitle={ intl.formatMessage(messages.instance) }
                                                total={() => (
                                                    <span>
                                                        {instantCcs.reduce((pre, now) => now.y + pre, 0)}
                                                    </span>
                                                )}
                                                data={instantCcs}
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
