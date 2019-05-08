// https://umijs.org/config/
import os from 'os';
import pageRoutes from './router.config';
import webpackPlugin from './plugin.config';
import defaultSettings from '../src/defaultSettings';
import slash from 'slash2';
import theme from './theme';

const { pwa, primaryColor } = defaultSettings;
// preview.pro.ant.design only do not use in your production ; preview.pro.ant.design 专用环境变量，请不要在你的项目中使用它。
const { TEST } = process.env;
const PROXY = process.env.PROXY || 'http://127.0.0.1/engine';

const plugins = [
  [
    'umi-plugin-react',
    {
      antd: true,
      dva: {
        hmr: true,
      },
      locale: {
        enable: true, // default false
        default: 'en-US', // default zh-CN
        baseNavigator: true, // default true, when it is true, will use `navigator.language` overwrite default
      },
      dynamicImport: {
        loadingComponent: './components/PageLoading/index',
        webpackChunkName: true,
        level: 3,
      },
      pwa: pwa
        ? {
            workboxPluginMode: 'InjectManifest',
            workboxOptions: {
              importWorkboxFrom: 'local',
            },
          }
        : false,
      ...(!TEST && os.platform() === 'darwin'
        ? {
            dll: {
              include: ['dva', 'dva/router', 'dva/saga', 'dva/fetch'],
              exclude: ['@babel/runtime', 'netlify-lambda'],
            },
            hardSource: false,
          }
        : {}),
    },
  ],
];

export default {
  // add for transfer to umi
  plugins,
  treeShaking: true,
  targets: {
    ie: 11,
  },
  // devtool: false,
  // 路由配置
  routes: pageRoutes,
  // Theme for antd
  // https://ant.design/docs/react/customize-theme-cn
  theme,
  proxy: {
    '/api': {
      target: PROXY,
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    },
  },
  ignoreMomentLocale: true,
  lessLoaderOptions: {
    javascriptEnabled: true,
  },
  disableRedirectHoist: true,
  cssLoaderOptions: {
    modules: true,
    getLocalIdent: (context, localIdentName, localName) => {
      if (
        context.resourcePath.includes('node_modules') ||
        context.resourcePath.includes('ant.design.pro.less') ||
        context.resourcePath.includes('global.less')
      ) {
        return localName;
      }
      const match = context.resourcePath.match(/src(.*)/);
      if (match && match[1]) {
        const antdProPath = match[1].replace('.less', '');
        const arr = slash(antdProPath)
          .split('/')
          .map(a => a.replace(/([A-Z])/g, '-$1'))
          .map(a => a.toLowerCase());
        return `cello${arr.join('-')}-${localName}`.replace(/--/g, '-');
      }
      return localName;
    },
  },
  manifest: {
    basePath: '/',
  },

  chainWebpack: webpackPlugin,
};
