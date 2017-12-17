
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/2.
 */
var rp = require("request-promise");
var uuid = require("node-uuid");
var config = require("./configuration");
import UserModel from '../models/user'
const log4js = require('log4js');
const logger = log4js.getLogger(__filename.slice(__dirname.length + 1));
const logLevel = process.env.DEV === "True" ? "DEBUG" : "INFO"
logger.setLevel(logLevel);

function user() {}
user.prototype = {
    BaseURL: config.SV_BaseURL,
    active: function (apikey) {
        return new Promise(function (resolve, reject) {
            rp({
                uri: this.BaseURL + "user/active/" + apikey,
                json: true
            }).then(function (response) {
                resolve(response)
            }).catch(function (err) {
                reject({
                    success: false,
                    message: err.message || "System maintenance, please try again later!"
                })
            })
        }.bind(this));
    },
    search: function (username) {
        return new Promise(function (resolve, reject) {
            rp({
                uri: this.BaseURL + "user/search?username=" + username,
                json: true
            }).then(function (response) {
                resolve(response)
            }).catch(function (err) {
                reject({
                    success: false,
                    message: err.message || "System maintenance, please try again later!"
                })
            })
        }.bind(this));
    },
    changePassword: function (apikey, origin_password, new_password) {
        return new Promise(function (resolve, reject) {
            rp({
                method: "POST",
                uri: this.BaseURL + "user/password/change/" + apikey,
                formData: {
                    origin_password,
                    new_password
                },
                json: true
            }).then(function (response) {
                resolve(response)
            }).catch(function (err) {
                reject({
                    success: false,
                    message: err.message || "System maintenance, please try again later!"
                })
            })
        }.bind(this));
    },
    resetPassword: function (apikey, new_password) {
        return new Promise(function (resolve, reject) {
            rp({
                method: "POST",
                uri: this.BaseURL + "user/password/reset/" + apikey,
                formData: {
                    new_password
                },
                json: true
            }).then(function (response) {
                resolve(response)
            }).catch(function (err) {
                reject({
                    success: false,
                    message: err.message || "System maintenance, please try again later!"
                })
            })
        }.bind(this));
    },
    account: function(apikey) {
        return new Promise(function(resolve, reject) {
            rp({
                uri: this.BaseURL + "user/account/" + apikey,
                json: true
            }).then(function(response) {
                const {username, apikey, isActivated, balance} = response;
                UserModel.findOneOrCreate({name: username, userId: apikey}, (err, user) => {
                  resolve({
                    success: true,
                    username,
                    apikey,
                    isActivated,
                    balance
                  });
                })
            }).catch(function(err) {
                reject({
                    success: false,
                    message: err.message || "System maintenance, please try again later!"
                });
            });
        }.bind(this));
    },
    validate: function(name, password) {
        return new Promise(function(resolve, reject) {
            rp({
                method: "POST",
                uri: this.BaseURL + "auth/login",
                formData: {
                    username: name,
                    password: password
                },
                json: true
            }).then(function(response) {
                if (response.success) {
                    resolve({
                        success: true,
                        apikey: response.id
                    });
                } else {
                    var e = new Error(response.description);
                    e.status = 403;
                    throw e;
                }
            }).catch(function(err) {
                reject({
                    success: false,
                    message: (err.status === 403 && err.message) || "System maintenance, please try again later!"
                });
            });
        }.bind(this));
    },
    register: function(name, password) {
        var apikey = uuid.v1();
        return new Promise(function(resolve, reject) {
            rp({
                method: "POST",
                uri: this.BaseURL + "auth/register",
                formData: {
                    username: name,
                    password: password
                },
                json: true
            }).then(function(response) {
                if (response.success) {
                    const {username, apikey, isActivated, balance} = response;
                    resolve({
                        success: true,
                        apikey: apikey,
                        username,
                        isActivated,
                        balance
                    });
                } else {
                    var e = new Error(response.description);
                    e.status = 409;
                    throw e;
                }
            }).catch(function(err) {
                reject({
                    success: false,
                    message: (err.status === 409 && err.message) || "System maintenance, please try again later!"
                });
            });
        }.bind(this));
    }
};
module.exports = user;