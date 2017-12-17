
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
*/
var express = require("express");
var config = require("../../modules/configuration");
var User = require("../../modules/user");

var router = express.Router();

router.get("/", function(req, res, next) {
    if (req.session.hasOwnProperty("balance")) {
        next();
    } else {
        var userInfo = JSON.parse(req.cookies[config.cookieName]);
        var user = new User();
        user.account(userInfo.apikey).then(function(result) {
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
    let userInfo = JSON.parse(req.cookies[config.cookieName]);
    userInfo["language"] = req.language
    renderer["chainNum"] = 1;
    renderer["contractNum"] = 1;
    res.render("dashboard", userInfo)
    // next()
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