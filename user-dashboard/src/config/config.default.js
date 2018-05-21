'use strict';
const path = require('path');

const apiBaseUrl = `http://${process.env.RESTFUL_SERVER}/api`;
module.exports = appInfo => {
  const config = exports = {
    logger: {
      level: process.env.LOG_LEVEL || 'INFO',
    },
    static: {
      prefix: `${process.env.WEBROOT}static/`,
      dir: [path.join(appInfo.baseDir, 'app/assets/public')],
    },
    view: {
      defaultViewEngine: 'nunjucks',
      defaultExtension: '.tpl',
      mapping: {
        '.tpl': 'nunjucks',
      },
    },
    operator: {
      url: {
        base: apiBaseUrl,
        login: `${apiBaseUrl}/auth/login`,
      },
    },
  };

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1526391549099_1300';

  // add your config here
  config.middleware = [];

  return config;
};
