'use strict'
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken'); //引入jsonwebtoken
const LocalStrategy = require('passport-local').Strategy;

module.exports = (options, app) => {
    return async function userInterceptor(ctx, next){
        if(ctx.originalUrl !== '/') {
            //const authToken = await ctx.app.redis.get(ctx.req.user.username);
            let jwtToken = ctx.req.headers.authorization;
            const authToken = jwtToken && jwtToken.replace("JWT ", "");
            if (authToken) {
                const res = await ctx.service.user.verifyToken(authToken); // 解密获取的Token
                console.log(res);
                if (res !== "overdue" && res !== "invalid") {
                    // 如果需要限制单端登陆或者使用过程中废止某个token，或者更改token的权限。也就是说，一旦 JWT 签发了，在到期之前就会始终有效
                    // 此处使用redis进行保存
                    ctx.req.user={
                        username: res.username,
                        userid: res.id,
                    };
                    await next();
                } else {
                    //错误码为401，在utils/request中，401错误会返回到登陆页面
                    ctx.status = 401;
                    ctx.body = {msg: '登录状态已过期'};
                   // ctx.redirect('http://127.0.0.1:8081/#/user/login');
                }
            } else {
                ctx.status = 401;
                ctx.body = {msg: '请登陆后再进行操作'};
               // ctx.redirect('http://127.0.0.1:8081/#/user/login');
            }
        } else{
            await next();
        }
    }
};