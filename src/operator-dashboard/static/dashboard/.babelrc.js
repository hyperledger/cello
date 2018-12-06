/*
 SPDX-License-Identifier: Apache-2.0
*/
module.exports = {
  plugins: [
    [
      'babel-plugin-module-resolver',
      {
        alias: {
          components: './src/components',
        },
      },
    ],
  ],
};
