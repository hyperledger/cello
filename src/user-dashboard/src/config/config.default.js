'use strict';
const path = require('path');
const Enum = require('enum');

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
    passportOauth2: {
      key: process.env.SSO_KEY,
      secret: process.env.SSO_SECRET,
      callbackURL: `${process.env.WEBROOT}passport/oauth2`,
      authorizationURL: `http://${process.env.SERVER_PUBLIC_IP}:${process.env.KEYCLOAK_SERVER_PORT}/auth/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/auth`,
      tokenURL: `http://${process.env.SERVER_PUBLIC_IP}:${process.env.KEYCLOAK_SERVER_PORT}/auth/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
    },
    view: {
      defaultViewEngine: 'nunjucks',
      defaultExtension: '.tpl',
      mapping: {
        '.tpl': 'nunjucks',
      },
    },
    parse: {
      client: {
        serverUrl: process.env.PARSE_SERVER_URL,
        applicationId: process.env.PARSE_SERVER_APPLICATION_ID,
        javascriptKey: process.env.PARSE_SERVER_JAVASCRIPT_KEY,
        masterKey: process.env.PARSE_SERVER_MASTER_KEY,
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
      channelName: 'mychannel',
      smartContracts: {
        fabric: [
          {
            name: 'chaincode_example02',
            path: '/var/www/resource/smart_contract/fabric/chaincode_example02',
            version: 'v1.0',
            description: 'This is a demo smart contract example02 for fabric v1.0, can not install&instantiate on fabric v1.2',
            default: {
              parameters: {
                instantiate: ['a', '100', 'b', '100'],
                invoke: ['a', 'b', '1'],
                query: ['a'],
              },
              functions: {
                invoke: 'invoke',
                query: 'query',
              },
            },
          },
        ],
      },
      admins: [
        {
          username: 'admin',
          secret: 'adminpw',
        },
      ],
    },
    dataDir: '/opt/data',
    io: {
      init: { },
      namespace: {
        '/': {
          connectionMiddleware: [],
          packetMiddleware: [],
        },
      },
    },
  };

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1526391549099_1300';

  // add your config here
  config.middleware = [];

  return config;
};
