/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';
const LocalStrategy = require('passport-local').Strategy;

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, passport } = app;
  passport.use(new LocalStrategy({
    passReqToCallback: true,
  }, (req, username, password, done) => {
    const user = {
      provider: 'local',
      username,
      password,
    };
    app.passport.doVerify(req, user, done);
  }));

  passport.verify(async (ctx, user) => {
    const userInfo = await ctx.service.user.login(user);
    ctx.login(userInfo);
    return await userInfo;
  });
  passport.serializeUser(async (ctx, user) => {
    return user;
  });
  passport.deserializeUser(async (ctx, user) => {
    return user;
  });

  router.get('/', controller.home.index);
  router.post('/login', passport.authenticate('local', { successRedirect: process.env.WEBROOT }));
  router.get('/logout', controller.home.logout);
  require('./router/api')(app);

  router.prefix(process.env.WEBROOT);
};
