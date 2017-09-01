/**
 * Created by lixuc on 2017/5/3.
 */
var express = require("express");
var config = require("../../modules/configuration");
var User = require("../../modules/user");
var Chain = require("../../modules/chain");
var Contract = require("../../modules/contract");

var router = express.Router();

router.get("/", function(req, res, next) {
    if (req.session.hasOwnProperty("balance")) {
        next();
    } else {
        var userInfo = JSON.parse(req.cookies[config.cookieName]);
        var user = new User();
        user.account(userInfo.apikey).then(function(result) {
            //将用户的blue points保存到session中，有效期24小时
            req.session.balance = result.balance;
            next();
        }).catch(function(err) {
            var e = new Error(err.message);
            e.status = 500;
            next(e);
        });
    }
}, function(req, res, next) {
    var renderer = {
        pointBalance: req.session.balance
    };
    var userInfo = JSON.parse(req.cookies[config.cookieName]);
    renderer["chainNum"] = 1;
    renderer["contractNum"] = 1;
    res.render("dashboard/home", renderer)
    next()
    // var chain = new Chain(userInfo.apikey);
    // var contract = new Contract(userInfo.apikey);
    // chain.amount().then(function(result) {
    //     renderer["chainNum"] = result.amount;
    //     return contract.amount();
    // }).then(function(result) {
    //     renderer["contractNum"] = result.amount;
    //     res.render("dashboard/home", renderer);
    // }).catch(function(err) {
    //     var e = new Error(err.message);
    //     e.status = 500;
    //     next(e);
    // });
});
module.exports = router;