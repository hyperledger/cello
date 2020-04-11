'use strict';
const path = require('path');
const Enum = require('enum');

// in fact, "apiBaseUrl" and "operator" is not
// keep it for cell's old code
const apiBaseUrl = `http://operator-dashboard:8071/api`;
module.exports = appInfo => {
  const config = exports = {
    logger: {
      level: process.env.LOG_LEVEL || 'INFO',
    },
    static: {
      prefix: `/static/`,
      dir: [path.join(appInfo.baseDir, 'app/assets/public')],
    },
    view: {
      defaultViewEngine: 'nunjucks',
      defaultExtension: '.tpl',
      mapping: {
        '.tpl': 'nunjucks',
      },
    },
    mongoose: {
      client: {
        //url: `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`,
        url: `dashboard_mongo:27017/user_dashboard`,
        options: {},
      },
    },
    operator: {
      url: {
        base: apiBaseUrl,
        login: `${apiBaseUrl}/auth/login`,
        cluster: {
          list: `${apiBaseUrl}/clusters`,
          operate: `${apiBaseUrl}/cluster_op`,

        },
      },
    },
    operations: new Enum(['ApplyChain', 'ReleaseChain', 'NewCode', 'InstallCode', 'InstantiateCode', 'Invoke', 'Query']),
    default: {
      sysChannelName: 'testchainid',
      channelName: 'mychannel',
      smartContracts: {
        fabric: [
          {
            name: 'chaincode_example02',
            path: '/var/www/resource/smart_contract/fabric/chaincode_example02',
            version: 'v1.0',
            description: 'This is a demo smart contract example02.',
          },
        ],
      },
      admins: [
        {
          username: 'admin',
          secret: 'adminpw',
        },
      ],
      fabricCaVersions: {
        v1_0: 'ca_v1.0',
        v1_1: 'ca_v1.1',
        v1_4: 'ca_v1.4',
      },
    },
    dataDir: '/opt/data',
    fabricDir: '/opt/fabric',
    io: {
      init: { },
      namespace: {
        '/': {
          connectionMiddleware: [],
          packetMiddleware: [],
        },
      },
    },
    security:{
      csrf:{
          enable:false,
      },
    },
  };

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1526391549099_1300';

  // add your config here
  config.middleware = [ 'jwt' ];

  config.jwt = {
    enable: true,
    ignore: ['/login','/v2/token','/v2/sys_channel','/v2/sys_channel_orderer','/logout','/public/','/v2/resources', '/v2/channels/:channel_id/appOperation'], //哪些请求不需要认证
  };


  return config;
};
