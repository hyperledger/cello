import { Router } from 'express'
import config from "../../../modules/configuration"
import User from "../../../modules/user"

const router = new Router()

router.post("/", function(req, res) {
    const user = new User();
    user.validate(req.body.username, req.body.password).then(function(result) {
        return user.account(result.apikey);
    }).then(function(result) {
        const userInfo = {
            username: result.username,
            apikey: result.apikey,
            isActivated: result.isActivated
        };
        //将用户的blue points保存到session中，有效期24小时
        req.session.balance = result.balance;
        //将用户信息保存到cookie，如果remember me，保存一年
        if (req.body.rememberme === "true") {
            res.cookie(config.cookieName, JSON.stringify(userInfo), {
                maxAge: 365*24*60*60*1000
            });
        } else {
            res.cookie(config.cookieName, JSON.stringify(userInfo));
        }
        res.json(Object.assign(userInfo, { success: true }));
    }).catch(function(err) {
        res.json(err);
    });
});

export default router
