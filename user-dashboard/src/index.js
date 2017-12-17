
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
const requestLanguage = require('express-request-language');
const bearerToken = require('express-bearer-token');
const expressJWT = require('express-jwt');
const jwt = require('jsonwebtoken');
const log4js = require('log4js');
const logger = log4js.getLogger(__filename.slice(__dirname.length + 1));
const logLevel = process.env.DEV === "True" ? "DEBUG" : "INFO"
const config = require("./modules/configuration");
import appConfig from './config'
logger.setLevel(logLevel);

const mongoose = require('mongoose');

const server = require('http').Server(app);
const io = require('./io').initialize(server);
// const io = require('socket.io')(server);

mongoose.Promise = global.Promise;
logger.info(config.mongodb.ip, config.mongodb.port, config.mongodb.name)
mongoose.connect('mongodb://'+config.mongodb.ip+':'+config.mongodb.port+'/' + config.mongodb.name, {useMongoClient: true});

app.engine('html', cons.swig)
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "html");
app.set('secret', new Buffer('cello-user-dashboard', 'base64'));

app.use("/static", express.static(path.join(__dirname, "public")));
const unlessPath = ["/dashboard", "/logout", "/api/register", "/languages/zh-CN",
                    "/languages/en", "/login", "/", "/api/login", "/favicon.ico"]

app.use(expressJWT({
  secret: app.get("secret")
}).unless({
  path: unlessPath
}));
app.use(bearerToken());
app.use(function(req, res, next) {
  if (unlessPath.indexOf(req.originalUrl) >= 0) {
    return next();
  }

  const token = req.token;
  jwt.verify(token, app.get('secret'), function(err, decoded) {
    if (err) {
      res.send({
        success: false,
        message: 'Failed to authenticate token. Make sure to include the ' +
        'token returned from /dashboard call in the authorization header ' +
        ' as a Bearer token'
      });
      return;
    } else {
      // add the decoded user name and org name to the request object
      // for the downstream code to use
      req.username = decoded.username;
      req.apikey = decoded.apikey;
      req.isActivated = decoded.isActivated;
      return next();
    }
  });
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.json({limit: appConfig.fileUploadLimits}));
app.use(bodyParser.urlencoded({ extended: true, limit: appConfig.fileUploadLimits }));
app.use(cookieParser());
app.use(requestLanguage({
  languages: ['en', 'en-US', 'zh-CN'],
  cookie: {
    name: 'language',
    options: { maxAge: 24*3600*1000 },
    url: '/languages/{language}'
  }
}));
app.use(session({
    secret: "blockchain dashboard",
    resave: true,
    saveUninitialized: false,
    unset: "destroy",
    cookie: { maxAge: 24*60*60*1000 }
}));
app.use("/api", require("./routes/api"));
app.use("/", require("./routes/index"));
app.use("/dashboard", require("./routes/dashboard/filter"));
app.use("/dashboard", require("./routes/dashboard/home"));
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send(err.message);
});

server.listen(8080, function () {
  logger.info("Server started>>>");
})
//
// io.on('connection', function (socket) {
//   socket.emit('news', { hello: 'world' });
//   socket.on('my other event', function (data) {
//     logger.debug(data);
//   });
// });
//
// app.io = io;