import React from 'react'
import { Menu, Icon, Popover } from 'antd'
import styles from './main.less'
import Menus from './menu'

const SubMenu = Menu.SubMenu

function Header ({user, switchSider, siderFold, isNavbar, menuPopoverVisible, location, switchMenuPopover}) {
  const menusProps = {
    siderFold: false,
    darkTheme: false,
    isNavbar,
    handleClickNavMenu: switchMenuPopover,
    location
  }
  return (
    <div className={styles.header}>
      {isNavbar
        ? <Popover placement='bottomLeft' onVisibleChange={switchMenuPopover} visible={menuPopoverVisible} overlayClassName={styles.popovermenu} trigger='click' content={<Menus {...menusProps} />}>
          <div className={styles.siderbutton}>
            <Icon type='bars' />
          </div>
        </Popover>
        : <div className={styles.siderbutton} onClick={switchSider}>
          <Icon type={siderFold ? 'menu-unfold' : 'menu-fold'} />
        </div>}

      <Menu className='header-menu' mode='horizontal'>
        <SubMenu style={{
          float: 'right'
        }} title={user.name}>
        </SubMenu>
      </Menu>
    </div>
  )
}

export default Header
