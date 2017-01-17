import React, { PropTypes } from 'react'
import { connect } from 'dva'
import Header from '../components/layout/header'
import Bread from '../components/layout/bread'
import Footer from '../components/layout/footer'
import Sider from '../components/layout/sider'
import styles from '../components/layout/main.less'
import { Spin } from 'antd'
import { classnames } from '../utils'
import '../components/layout/common.less'

function App ({children, location, dispatch, app}) {
  const {user, siderFold, darkTheme, isNavbar, menuPopoverVisible} = app

  const headerProps = {
    user,
    siderFold,
    location,
    isNavbar,
    menuPopoverVisible,
    switchMenuPopover () {
      dispatch({type: 'app/switchMenuPopver'})
    },
    switchSider () {
      dispatch({type: 'app/switchSider'})
    }
  }

  const siderProps = {
    siderFold,
    darkTheme,
    location,
    changeTheme () {
      dispatch({type: 'app/changeTheme'})
    }
  }

  return (
      <div>
        <div className={classnames(styles.layout, {[styles.fold]: isNavbar ? false : siderFold}, {[styles.withnavbar]: isNavbar})}>
            {!isNavbar ? <aside className={classnames(styles.sider, {[styles.light]: !darkTheme})}>
                  <Sider {...siderProps} />
                </aside> : ''}
          <div className={styles.main}>
            <Header {...headerProps} />
            <Bread location={location} />
            <div className={styles.container}>
              <div className={styles.content}>
                  {children}
              </div>
            </div>
            <Footer />
          </div>
        </div>
      </div>
  )
}

App.propTypes = {
  children: PropTypes.element.isRequired,
  location: PropTypes.object,
  dispatch: PropTypes.func,
  user: PropTypes.object,
  siderFold: PropTypes.bool,
  darkTheme: PropTypes.bool
}

export default connect(({app}) => ({app}))(App)
