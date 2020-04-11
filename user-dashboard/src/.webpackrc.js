const path = require('path');

export default {
  entry: 'app/assets/src/index.js',
  extraBabelPlugins: [
    ['import', { libraryName: 'antd', libraryDirectory: 'es', style: true }],
  ],
  env: {
    development: {
      extraBabelPlugins: ['dva-hmr'],
    },
  },
  alias: {
    components: path.resolve(__dirname, 'app/assets/src/components/'),
  },
  ignoreMomentLocale: true,
  theme:'app/assets/src/theme.js',
  outputPath: 'app/assets/public',
  hash: false,
  es5ImcompatibleVersions: true,
};
