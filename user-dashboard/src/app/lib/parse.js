'use strict';

const path = require('path');
const Parse = require('parse/node');

module.exports = app => {
  const { parse: { client: { serverUrl, applicationId, javascriptKey, masterKey } } } = app.config;
  app.coreLogger.info('url %s application id %s javascript key %s master key %s', serverUrl, applicationId, javascriptKey, masterKey);
  Parse.initialize(applicationId, javascriptKey, masterKey);

  Parse.serverURL = serverUrl;
  app.Parse = Parse;

  app.beforeStart(() => {
    loadModelToApp(app);
  });
};

function loadModelToApp(app) {
  const dir = path.join(app.config.baseDir, 'app/models');
  app.loader.loadToApp(dir, 'parse', {
    inject: app,
    caseStyle: 'upper',
    filter(model) {
      return model.prototype instanceof app.Parse.Object;
    },
  });
}
