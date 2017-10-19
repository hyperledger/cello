/**
 * Created by lixuc on 2017/5/17.
 */
var express = require("express");
var router = express.Router();

router.get("/store", function(req, res) {
    res.render("dashboard/store");
});
module.exports = router;