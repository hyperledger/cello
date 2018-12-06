'use strict';

// had enabled by egg
// exports.static = true;
exports.passport = {
  enable: true,
  package: 'egg-passport',
};

exports.passportOauth2 = {
  enable: true,
  package: 'egg-passport-oauth2',
};

exports.nunjucks = {
  enable: true,
  package: 'egg-view-nunjucks',
};

exports.io = {
  enable: true,
  package: 'egg-socket.io',
};

exports.mongoose = {
  enable: true,
  package: 'egg-mongoose',
};

exports.validate = {
  enable: true,
  package: 'egg-validate',
};
