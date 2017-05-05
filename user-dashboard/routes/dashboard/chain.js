/**
 * Created by lixuc on 2017/5/5.
 */
var express = require("express");
var config = require("../../modules/configuration");
var Chain = require("../../modules/chain");

var router = express.Router();

router.get("/chain", function(req, res, next) {
    var userInfo = JSON.parse(req.cookies[config.cookieName]);
    var chain = new Chain(userInfo.apikey);
    chain.list().then(function(result) {
        res.render("dashboard/chain/list", {
            clusters: result.chains,
            pages: result.totalPage
        });
    }).catch(function(err) {
        var e = new Error(err.message);
        e.status = 500;
        next(e);
    });
});
module.exports = router;