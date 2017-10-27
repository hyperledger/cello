/**
 * Created by lixuc on 2017/5/2.
 */
import config from "../modules/configuration"
import { Router } from 'express'

const router = new Router()

router.get("/", function(req, res) {
    const userInfo = req.cookies[config.cookieName];
    if (userInfo) {
        res.render("index", JSON.parse(userInfo));
    } else {
        res.render("index");
    }
});
router.get("/login", function (req, res) {
    res.render("login");
});
router.get("/logout", function(req, res) {
    req.session.destroy();
    res.clearCookie(config.cookieName);
    res.redirect("/");
});
module.exports = router;