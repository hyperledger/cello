import React, { Fragment } from 'react';
import { Row, Col, Icon, Card } from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './guide.less';
import classNames from "classnames";
import guideImg from '../../assets/guide.png'
import { defineMessages, IntlProvider } from "react-intl";
import {getLocale} from "../../utils/utils";

const currentLocale = getLocale();

const intlProvider = new IntlProvider(
    { locale: currentLocale.locale, messages: currentLocale.messages },
    {}
);
const { intl } = intlProvider.getChildContext();

const messages = defineMessages({
    menus: {
        pageTitle: {
            id: 'Menu.Guide',
            defaultMessage: '使用向导',
        },
        pageDescription: {
            id: 'Guide.Description',
            defaultMessage: '使用向导帮助您使用Cello系统开展区块链业务。',
        },
        title: {
            id: 'Guide.ContentTitle',
            defaultMessage: '开展区块链业务流程',
        },
        channelMenu: {
            id: 'Guide.ChannelMenu',
            defaultMessage: '1、创建通道',
        },
        channelContent: {
            id: 'Guide.ChannelContent',
            defaultMessage: '通道是区块链中各组织间开展业务的载体。',
        },
        nodeMenu: {
            id: 'Guide.NodeMenu',
            defaultMessage: '2、加入节点',
        },
        nodeContent: {
            id: 'Guide.NodeContent',
            defaultMessage: '在通道创建好之后，需要将账本节点加入到所创建的指定的通道中。',
        },
        chainCodeUploadMenu: {
            id: 'Guide.ChainCodeUploadMenu',
            defaultMessage: '3、上传链码',
        },
        chainCodeUploadContent: {
            id: 'Guide.ChainCodeUploadContent',
            defaultMessage: '链码是包含业务执行逻辑的代码，开展具体业务前需要将已开发好的链码上传至链码中心。',
        },
        chainCodeInstallMenu: {
            id: 'Guide.ChainCodeInstallMenu',
            defaultMessage: '4、安装链码',
        },
        chainCodeInstallContent: {
            id: 'Guide.ChainCodeInstallContent',
            defaultMessage: '上传完链码之后，需要将链码安装到指定的账本节点。',
        },
        chainCodeInstantiateMenu: {
            id: 'Guide.ChainCodeInstantiateMenu',
            defaultMessage: '5、实例化链码',
        },
        chainCodeInstantiateContent: {
            id: 'Guide.ChainCodeInstantiateContent',
            defaultMessage: '已安装好的链码需要实例化，从而实现相应业务的开展。',
        },
    }
});

const channel = intl.formatMessage(messages.menus.channelContent);
const joinPeer = intl.formatMessage(messages.menus.nodeContent);
const upLoad = intl.formatMessage(messages.menus.chainCodeUploadContent);
const install = intl.formatMessage(messages.menus.chainCodeInstallContent);
const instant = intl.formatMessage(messages.menus.chainCodeInstantiateContent);

const clsString = classNames(styles.result);

export default () => (
    <PageHeaderLayout
        title={intl.formatMessage(messages.menus.pageTitle)}
        content={intl.formatMessage(messages.menus.pageDescription)}
        logo={<Icon type="arrow-right" style={{fontSize: 30, color: '#722ed1'}} />}
    >
        <Card bordered={false}>
            <div className={clsString}>
                <div className={styles.title}>{intl.formatMessage(messages.menus.title)}</div>
                <div >
                    <Row className={styles.title2}>
                        <Col span={4}>
                            <span>{intl.formatMessage(messages.menus.channelMenu)}</span>
                        </Col>
                        <Col span={1}>
                            <img src={guideImg} />
                        </Col>
                        <Col span={4}>
                            <span>{intl.formatMessage(messages.menus.nodeMenu)}</span>
                        </Col>
                        <Col span={1}>
                            <img src={guideImg} />
                        </Col>
                        <Col span={4}>
                            <span>{intl.formatMessage(messages.menus.chainCodeUploadMenu)}</span>
                        </Col>
                        <Col span={1}>
                            <img src={guideImg} />
                        </Col>
                        <Col span={4}>
                            <span>{intl.formatMessage(messages.menus.chainCodeInstallMenu)}</span>
                        </Col>
                        <Col span={1}>
                            <img src={guideImg} />
                        </Col>
                        <Col span={4}>
                            <span>{intl.formatMessage(messages.menus.chainCodeInstantiateMenu)}</span>
                        </Col>
                    </Row>
                </div>
                
                <Row>
                    <Col span={2}>
                        <div className={styles.subtitle}>
                            {intl.formatMessage(messages.menus.channelMenu)}
                        </div>
                    </Col>
                    <Col span={22}>
                        <div className={styles.description}>
                            {channel}
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col span={2}>
                        <div className={styles.subtitle}>
                            {intl.formatMessage(messages.menus.nodeMenu)}
                        </div>
                    </Col>
                    <Col span={22}>
                        <div className={styles.description}>
                            {joinPeer}
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col span={2}>
                        <div className={styles.subtitle}>
                            {intl.formatMessage(messages.menus.chainCodeUploadMenu)}
                        </div>
                    </Col>
                    <Col span={22}>
                        <div className={styles.description}>
                            {upLoad}
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col span={2}>
                        <div className={styles.subtitle}>
                            {intl.formatMessage(messages.menus.chainCodeInstallMenu)}
                        </div>
                    </Col>
                    <Col span={22}>
                        <div className={styles.description}>
                            {install}
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col span={3}>
                        <div className={styles.subtitle}>
                            {intl.formatMessage(messages.menus.chainCodeInstantiateMenu)}
                        </div>
                    </Col>
                    <Col span={21} >
                        <div className={styles.description} style={{marginLeft:-30}} >
                            {instant}
                        </div>
                    </Col>
                </Row>
            </div>
        </Card>
    </PageHeaderLayout>
);
