
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/8.
 */
var config = require("./configuration");
var f = require("util").format;
var mongo = require("mongodb");
var Grid = require("gridfs-stream");
var MongoClient = mongo.MongoClient;

function mongoclient() {
    var _db;
    var _gfs;
    this.getDB = function() {
        return new Promise(function(resolve, reject) {
            if (_db) {
                resolve(_db);
            } else {
                MongoClient.connect(this.url, function(err, db) {
                    if (err) reject(err);
                    else {
                        console.log("Connected successfully to Mongo DB server.");
                        _db = db;
                        resolve(db);
                    }
                });
            }
        }.bind(this));
    };
    this.getGridFS = function() {
        return new Promise(function(resolve, reject) {
            if (_gfs) {
                resolve(_gfs);
            } else {
                this.getDB().then(function(db) {
                    _gfs = Grid(db, mongo);
                    resolve(_gfs);
                }).catch(function(err) {
                    reject(err);
                });
            }
        }.bind(this));
    };
}
mongoclient.prototype = {
    url: config.mongodb.auth ?
        f(
            "mongodb://%s:%s@%s:%s/%s?authMechanism=%s",
            encodeURIComponent(config.mongodb.username),
            encodeURIComponent(config.mongodb.password),
            config.mongodb.ip,
            config.mongodb.port,
            config.mongodb.name,
            "DEFAULT"
        )
        :
        f(
            "mongodb://%s:%s/%s",
            config.mongodb.ip,
            config.mongodb.port,
            config.mongodb.name
        )
};
module.exports = new mongoclient();