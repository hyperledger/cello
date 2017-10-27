
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/2.
 */
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const app = express();
const cons = require('consolidate');
const cors = require("cors");

app.engine('html', cons.swig)
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "html");

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: "blockchain dashboard",
    resave: true,
    saveUninitialized: false,
    unset: "destroy",
    cookie: { maxAge: 24*60*60*1000 }
}));
app.use("/static", express.static(path.join(__dirname, "public")));
app.use("/api", require("./routes/api"));
app.use("/", require("./routes/index"));
app.use("/dashboard", require("./routes/dashboard/filter"));
app.use("/dashboard", require("./routes/dashboard/home"));
app.use("/dashboard", require("./routes/dashboard/chain"));
app.use("/dashboard", require("./routes/dashboard/contract"));
app.use("/dashboard", require("./routes/dashboard/analytics"));
app.use("/dashboard", require("./routes/dashboard/store"));
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send(err.message);
});
app.listen(8080, function() {
    console.log("Server started>>>");
});