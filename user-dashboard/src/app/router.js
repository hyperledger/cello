/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';
const LocalStrategy = require('passport-local').Strategy;

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    const { router, controller, passport, io } = app;
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
    
    router.get('home', '/', controller.home.index);
    router.post('upload-smart-contract', '/upload-smart-contract', controller.smartContract.upload);
    router.post('/login', passport.authenticate('local', { successRedirect: '/' }));
    router.get('/logout', controller.home.logout);
    require('./router/api')(app);
    io.of('/').route('join', io.controller.home.join);
    
    router.prefix('/');
};
// module.exports = app => {
//    const { router, controller, io, jwt } = app;
//    router.get('home', '/', controller.home.index);
//    router.post('upload-smart-contract', '/upload-smart-contract', controller.smartContract.upload);
//    router.post('/login', controller.home.login);
//    router.redirect('/','/login');
//    router.get('/logout', controller.home.logout);
//    require('./router/api')(app);
//    io.of('/').route('join', io.controller.home.join);
//
//    router.prefix('/');
// };