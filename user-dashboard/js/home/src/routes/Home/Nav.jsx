import React from 'react';
import PropTypes from 'prop-types';
import TweenOne from 'rc-tween-one';
import { Menu } from 'antd';

const Item = Menu.Item;
const SubMenu = Menu.SubMenu;

class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      phoneOpen: false,
    };
  }

  phoneClick = () => {
    this.setState({
      phoneOpen: !this.state.phoneOpen,
    });
  }

  menuClick = (e) => {
      const {onClickProfile} = this.props;
      switch (e.key) {
          case 'logout':
              window.location.href = "/logout";
              break;
          case 'login':
              window.location.href = "/login";
              break;
          //case '0':
          //    window.location.href = "/dashboard/chain";
          //    break;
          //case '1':
          //    window.location.href = "/dashboard/contract";
          //    break;
          //case '2':
          //    window.location.href = "/dashboard/analytics";
          //    break;
          //case '3':
          //    window.location.href = "/dashboard/store";
          //    break;
          case 'profile':
              onClickProfile();
              break;
      }
  }

  render() {
    const props = { ...this.props };
    const isMode = props.isMode;
    delete props.isMode;
    let navData = { };
    let navChildren = Object.keys(navData)
      .map((key, i) => (<Item key={i}>{navData[key]}</Item>));
    if (window.username !== '') {
      navChildren.push(
          <SubMenu title={<span>{window.username}</span>}>
            <Item key="profile">Profile</Item>
            <Item key="logout">logout</Item>
          </SubMenu>
      )
    } else {
        navChildren.push(
            <Item key="login">Login</Item>
        )
    }
    return (<TweenOne
      component="header"
      animation={{ opacity: 0, type: 'from' }}
      {...props}
    >
      <TweenOne
        className={`${this.props.className}-logo`}
        animation={{ x: -30, type: 'from', ease: 'easeOutQuad' }}
        id={`${this.props.id}-logo`}
      >
        <img width="100%" src="/static/images/logo.svg" />
      </TweenOne>
      {isMode ? (<div
        className={`${this.props.className}-phone-nav${this.state.phoneOpen ? ' open' : ''}`}
        id={`${this.props.id}-menu`}
      >
        <div
          className={`${this.props.className}-phone-nav-bar`}
          onClick={() => {
            this.phoneClick();
          }}
        >
          <em />
          <em />
          <em />
        </div>
        <div
          className={`${this.props.className}-phone-nav-text`}
        >
          <Menu
            defaultSelectedKeys={['0']}
            mode="inline"
            theme="dark"
          >
            {navChildren}
          </Menu>
        </div>
      </div>) : (<TweenOne
        className={`${this.props.className}-nav`}
        animation={{ x: 30, type: 'from', ease: 'easeOutQuad' }}
      >
        <Menu
            onClick={this.menuClick}
            mode="horizontal" defaultSelectedKeys={['0']}
            id={`${this.props.id}-menu`}
        >
          {navChildren}
        </Menu>
      </TweenOne>)}
    </TweenOne>);
  }
}

Header.propTypes = {
  className: PropTypes.string,
  dataSource: PropTypes.object,
  id: PropTypes.string,
};

Header.defaultProps = {
  className: 'header0',
};

export default Header;
