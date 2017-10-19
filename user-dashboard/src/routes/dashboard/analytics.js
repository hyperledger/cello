/**
 * Created by lixuc on 2017/5/12.
 */
var express = require("express");
var config = require("../../modules/configuration");
var Chain = require("../../modules/chain");
var Analytics = require("../../modules/analytics");

var router = express.Router();

router.get([
    "/analytics",
    "/analytics/chaincode",
    "/analytics/fabric",
    "/analytics/infrastructure"
], function(req, res, next) {
    var userInfo = JSON.parse(req.cookies[config.cookieName]);
    var chain = new Chain(userInfo.apikey);
    chain.list(-1).then(function(result) {
        var chains = result.chains;
        if (chains.length) {
            chains.sort(function(c1, c2) {
                if (c1.name < c2.name) return -1;
                else if (c1.name > c2.name) return 1;
                else return 0;
            });
            res.locals.chains = chains;
            next();
        } else {
            res.render("dashboard/analytics/noChains");
        }
    }).catch(function(err) {
        var e = new Error(err.message);
        e.status = 500;
        next(e);
    });
});
router.get("/analytics", function(req, res, next) {
    var chains = res.locals.chains;
    var analytics = new Analytics(chains[0].id);
    analytics.overview().then(function(result) {
        res.render("dashboard/analytics/overview", result.statistic);
    }).catch(function(err) {
        var e = new Error(err.message);
        e.status = 500;
        next(e);
    });
});
router.get("/analytics/chaincode", function(req, res, next) {
    var chains = res.locals.chains;
    var analytics = new Analytics(chains[0].id);
    analytics.chaincodeList().then(function(result) {
        var chaincodes = result.chaincodes;
        var renderer = {
            chaincodes: chaincodes
        };
        if (chaincodes.length) {
            var invokeTimes = 0, responseTime = 0;
            for (var i in chaincodes) {
                invokeTimes += parseInt(chaincodes[i].invoke_times);
                responseTime += parseFloat(chaincodes[i].avg_response_time);
            }
            Object.assign(renderer, {
                invokeTimes: invokeTimes,
                avgResponseTime: parseFloat((responseTime / chaincodes.length).toFixed(2))
            });
        }
        res.render("dashboard/analytics/chaincode", renderer);
    }).catch(function(err) {
        var e = new Error(err.message);
        e.status = 500;
        next(e);
    });
});
router.get("/analytics/fabric", function(req, res) {
    res.render("dashboard/analytics/fabric");
});
router.get("/analytics/infrastructure", function(req, res) {
    res.render("dashboard/analytics/infrastructure");
});
module.exports = router;