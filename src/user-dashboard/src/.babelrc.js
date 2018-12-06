module.exports = {
  plugins: [
    [
      'babel-plugin-module-resolver',
      {
        alias: {
          components: './app/assets/src/components',
        },
      },
    ],
  ],
};
