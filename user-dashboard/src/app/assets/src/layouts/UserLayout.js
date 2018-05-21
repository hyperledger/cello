/*
 SPDX-License-Identifier: Apache-2.0
*/
import React, { Fragment } from 'react';
import { Link, Redirect, Switch, Route } from 'dva/router';
import DocumentTitle from 'react-document-title';
import Particles from 'react-particles-js';
import { Icon } from 'antd';
import GlobalFooter from '../components/GlobalFooter';
import styles from './UserLayout.less';
import logo from '../assets/logo.svg';
import { getRoutes } from '../utils/utils';

const copyright = (
  <Fragment>
    Copyright <Icon type="copyright" /> Hyperledger Cello
  </Fragment>
);

class UserLayout extends React.PureComponent {
  getPageTitle() {
    const { routerData, location } = this.props;
    const { pathname } = location;
    let title = 'Cello User Dashboard';
    if (routerData[pathname] && routerData[pathname].name) {
      title = `${routerData[pathname].name} - Cello User Dashboard`;
    }
    return title;
  }
  render() {
    const { routerData, match } = this.props;
    const particlesParams = {
      "particles": {
        "number": {
          "value": 10,
          "density": {
            "enable": true,
            "value_area": 800,
          },
        },
        "color": {
          "value": "#40a9ff",
        },
        "shape": {
          "type": "polygon",
          "stroke": {
            "width": 0,
            "color": "#000000",
          },
          "polygon": {
            "nb_sides": 5,
          },
        },
        "opacity": {
          "value": 0.5,
          "random": false,
          "anim": {
            "enable": false,
            "speed": 1,
            "opacity_min": 0.1,
            "sync": false,
          },
        },
        "size": {
          "value": 3,
          "random": true,
          "anim": {
            "enable": false,
            "speed": 40,
            "size_min": 0.1,
            "sync": false,
          },
        },
        "line_linked": {
          "enable": true,
          "distance": 150,
          "color": "#40a9ff",
          "opacity": 0.4,
          "width": 1,
        },
        "move": {
          "enable": true,
          "speed": 6,
          "direction": "none",
          "random": false,
          "straight": false,
          "out_mode": "out",
          "bounce": false,
          "attract": {
            "enable": false,
            "rotateX": 600,
            "rotateY": 1200,
          },
        },
      },
      "interactivity": {
        "detect_on": "canvas",
        "events": {
          "onhover": {
            "enable": true,
            "mode": "repulse",
          },
          "onclick": {
            "enable": true,
            "mode": "push",
          },
          "resize": true,
        },
        "modes": {
          "grab": {
            "distance": 400,
            "line_linked": {
              "opacity": 1,
            },
          },
          "bubble": {
            "distance": 400,
            "size": 40,
            "duration": 2,
            "opacity": 8,
            "speed": 3,
          },
          "repulse": {
            "distance": 200,
            "duration": 0.4,
          },
          "push": {
            "particles_nb": 4,
          },
          "remove": {
            "particles_nb": 2,
          },
        },
      },
    };
    return (
      <DocumentTitle title={this.getPageTitle()}>
        <div>
          <div className={styles.content}>
            <Particles params={particlesParams} className={styles.particles} />
            <div className={styles.top}>
              <div className={styles.header}>
                <Link to="/">
                  <img alt="logo" className={styles.logo} src={logo} />
                  <span className={styles.title}>Cello User Dashboard</span>
                </Link>
              </div>
              <div className={styles.desc}>Hyperledger Baas System</div>
            </div>
            <Switch>
              {getRoutes(match.path, routerData).map(item => (
                <Route
                  key={item.key}
                  path={item.path}
                  component={item.component}
                  exact={item.exact}
                />
              ))}
              <Redirect exact from="/user" to="/user/login" />
            </Switch>
          </div>
          <GlobalFooter copyright={copyright} />
        </div>
      </DocumentTitle>
    );
  }
}

export default UserLayout;
