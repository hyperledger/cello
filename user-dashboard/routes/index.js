/**
 * Created by lixuc on 2017/5/2.
 */
var express = require("express");
var config = require("../modules/configuration");
var router = express.Router();

router.get("/", function(req, res) {
    var userInfo = req.cookies[config.cookieName];
    if (userInfo) {
        res.render("index", JSON.parse(userInfo));
    } else {
        res.render("index");
    }
});
router.get("/logout", function(req, res) {
    req.session.destroy();
    res.clearCookie(config.cookieName);
    res.redirect(req.baseUrl);
});
module.exports = router;