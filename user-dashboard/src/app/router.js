/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, passport, io } = app;

  passport.verify(async (ctx, user) => {
    const userInfoUrl = `http://${process.env.SERVER_PUBLIC_IP}:${process.env.KEYCLOAK_SERVER_PORT}/auth/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`;
    const userInfo = await ctx.curl(userInfoUrl, {
      method: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      data: {
        access_token: user.params.access_token,
      },
      dataType: 'json',
    });
    const { preferred_username, sub, role, tenant } = userInfo.data;
    userInfo.data.id = sub;
    userInfo.data.token = user.params.access_token;
    userInfo.data.username = preferred_username;
    userInfo.data.role = role;
    userInfo.data.tenant = tenant;

    const userModel = await ctx.model.User.findOne({ username: preferred_username });
    if (!userModel) {
      await ctx.model.User.create({
        _id: sub,
        username: preferred_username,
      });
      await ctx.service.smartContract.copySystemSmartContract(sub);
    }

    ctx.login(userInfo.data);
    return await userInfo.data;
  });
  passport.serializeUser(async (ctx, user) => {
    return user;
  });
  passport.deserializeUser(async (ctx, user) => {
    return user;
  });

  router.get('home', '/', controller.home.index);
  router.post('upload-smart-contract', '/upload-smart-contract', controller.smartContract.upload);
  router.get('/logout', controller.home.logout);
  require('./router/api')(app);
  io.of('/').route('join', io.controller.home.join);

  router.prefix(process.env.WEBROOT);

  passport.mount('oauth2', {
    callbackURL: `${process.env.WEBROOT}passport/oauth2/`,
    successRedirect: `${process.env.WEBROOT}`,
  });
};
