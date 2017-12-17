
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
*/
import { Router } from 'express'
import config from "../../modules/configuration"
import Profile from "../../modules/profile"

const router = new Router();

router.get([
    "/",
], function(req, res, next) {
    let userInfo = req.cookies[config.cookieName];
    userInfo = userInfo ? JSON.parse(userInfo) : {}
    if (userInfo && userInfo.isActivated) {
        res.locals.username = userInfo.username || "";
        next()
        // const profile = new Profile(userInfo.apikey);
        // profile.load().then(function(result) {
        //     res.locals.username = result.result.name || userInfo.username.split("@")[0];
        //     next();
        // }).catch(function(err) {
        //     const e = new Error(err.message);
        //     e.status = 500;
        //     next(e);
        // });
    } else {
        res.cookie("referer", req.originalUrl);
        res.redirect("/");
    }
});
module.exports = router;