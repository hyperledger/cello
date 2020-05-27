import React, { PureComponent } from 'react';
import { injectIntl } from 'umi';
import { Spin, Menu, Avatar } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import HeaderDropdown from '../HeaderDropdown';
import SelectLang from '../SelectLang';
import styles from './index.less';

class GlobalHeaderRight extends PureComponent {
  render() {
    const { currentUser, onMenuClick, intl } = this.props;
    const menu = (
      <Menu className={styles.menu} selectedKeys={[]} onClick={onMenuClick}>
        <Menu.Item key="logout">
          <LogoutOutlined />
          {intl.formatMessage({
            id: 'menu.account.logout',
            defaultMessage: 'logout',
          })}
        </Menu.Item>
      </Menu>
    );
    const className = styles.right;
    // if (theme === 'dark') {
    //   className = `${styles.right}  ${styles.dark}`;
    // }
    return (
      <div className={className}>
        {currentUser.username ? (
          <HeaderDropdown overlay={menu}>
            <span className={`${styles.action} ${styles.account}`}>
              <Avatar size="small" className={styles.avatar} src="/avatar.png" alt="avatar" />
              <span className={styles.name}>{currentUser.username}</span>
            </span>
          </HeaderDropdown>
        ) : (
          <Spin size="small" style={{ marginLeft: 8, marginRight: 8 }} />
        )}
        <SelectLang className={styles.action} />
      </div>
    );
  }
}

export default injectIntl(GlobalHeaderRight);
