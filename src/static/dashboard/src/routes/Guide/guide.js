import React, { Fragment } from 'react';
import { Row, Col, Icon, Card } from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './guide.less';
import classNames from "classnames";
import guideImg from '../../../public/guide.png'
import { defineMessages, IntlProvider } from "react-intl";
import { getLocale } from '../../utils/utils';

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
            defaultMessage: '使用向导帮助您使用Cello系统构建区块链网络。',
        },
        title: {
            id: 'Guide.ContentTitle',
            defaultMessage: '构建区块链网络流程',
        },
        hostMenu: {
            id: 'Guide.HostMenu',
            defaultMessage: '1、添加主机',
        },
        hostContent: {
            id: 'Guide.HostContent',
            defaultMessage: '主机是运行区块链网络的载体，添加主机前需要确认主机网络连接正常，到主机管理页面，将目标主机添加到Cello系统中。',
        },
        orgMenu: {
            id: 'Guide.OrgMenu',
            defaultMessage: '2、创建组织',
        },
        orgContent: {
            id: 'Guide.OrgContent',
            defaultMessage: '在组织管理中，可创建新的组织，组织分为两种类型，分别为“peer”和“orderer”，每个网络中必须包含至少1个“orderer”组织和多个“peer”组织。“orderer”组织的主机（创建组织的时候会自动生成，不必单独创建）为交易排序，“peer”组织为联盟中的成员，可根据具体需求定义。',
        },
        networkMenu: {
            id: 'Guide.NetworkMenu',
            defaultMessage: '3、创建网络',
        },
        networkContent: {
            id: 'Guide.NetworkContent',
            defaultMessage: '在主机和组织都准备好之后，到网络管理中创建区块链网络，网络在创建之后会自动启动，所有属于本网络组织的节点都会启动，至此，已完成了区块链网络的构建。',
        },
    }
});
const host = intl.formatMessage(messages.menus.hostContent);
const organization = intl.formatMessage(messages.menus.orgContent);
const network = intl.formatMessage(messages.menus.networkContent);

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
                <div>
                    <Row className={styles.title}>
                        <Col span={6}>
                            <span>{intl.formatMessage(messages.menus.hostMenu)}</span>
                        </Col>
                        <Col span={3}>
                            <img src={guideImg} />
                        </Col>
                        <Col span={6}>
                            <span>{intl.formatMessage(messages.menus.orgMenu)}</span>
                        </Col>
                        <Col span={3}>
                            <img src={guideImg} />
                        </Col>
                        <Col span={6}>
                            <span>{intl.formatMessage(messages.menus.networkMenu)}</span>
                        </Col>
                    </Row>
                </div>
                <Row>
                    <Col span={2}>
                        <div className={styles.subtitle}>
                            {intl.formatMessage(messages.menus.hostMenu)}
                        </div>
                    </Col>
                    <Col span={22}>
                        <div className={styles.description}>
                            {host}
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col span={2}>
                        <div className={styles.subtitle}>
                            {intl.formatMessage(messages.menus.orgMenu)}
                        </div>
                    </Col>
                    <Col span={22}>
                        <div className={styles.description}>
                            {organization}
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col span={2}>
                        <div className={styles.subtitle}>
                            {intl.formatMessage(messages.menus.networkMenu)}
                        </div>
                    </Col>
                    <Col span={22}>
                        <div className={styles.description}>
                            {network}
                        </div>
                    </Col>
                </Row>
            </div>
        </Card>
    </PageHeaderLayout>
);
