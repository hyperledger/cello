/**
 * Created by lixuc on 2017/5/8.
 */
var express = require("express");
var config = require("../../modules/configuration");
var Contract = require("../../modules/contract");

var router = express.Router();

router.get("/contract", function(req, res, next) {
    var userInfo = JSON.parse(req.cookies[config.cookieName]);
    var renderer = {};
    var contract = new Contract(userInfo.apikey);
    contract.list("public").then(function(result) {
        renderer["public"] = result;
        return contract.list("private");
    }).then(function(result) {
        renderer["private"] = result;
        res.render("dashboard/contract/list", renderer);
    }).catch(function(err) {
        var e = new Error(err.message);
        e.status = 500;
        next(e);
    });
});
module.exports = router;