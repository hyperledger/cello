
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
*/
import { Router } from 'express'
import config from "../../../modules/configuration"
import User from "../../../modules/user"

const router = new Router()

router.post("/", function(req, res) {
    const user = new User();
    user.register(req.body.username, req.body.password).then(function(result) {
        return user.account(result.apikey);
    }).then(function(result) {
        const userInfo = {
            username: result.username,
            apikey: result.apikey,
            isActivated: result.isActivated
        };
        //将用户的blue points保存到session中，有效期24小时
        req.session.balance = result.balance;
        //将用户信息暂存到cookie
        res.cookie(config.cookieName, JSON.stringify(userInfo));
        res.json(Object.assign(userInfo, { success: true }));
    }).catch(function(err) {
        res.json(err);
    });
});

export default router
