
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/2.
 */
var rp = require("request-promise");
var uuid = require("node-uuid");
var config = require("./configuration");

function user() {}
user.prototype = {
    BaseURL: config.SV_BaseURL,
    account: function(apikey) {
        return new Promise(function(resolve, reject) {
            rp({
                uri: this.BaseURL + "user/account/" + apikey,
                json: true
            }).then(function(response) {
                const {username, apikey, isActivated, balance} = response.data;
                resolve({
                    success: true,
                    username,
                    apikey,
                    isActivated,
                    balance
                });
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
                uri: this.BaseURL + "login",
                formData: {
                    username: name,
                    password: password
                },
                json: true
            }).then(function(response) {
                if (response.data.success) {
                    resolve({
                        success: true,
                        apikey: response.data.id
                    });
                } else {
                    var e = new Error(response.description);
                    e.status = 403;
                    throw e;
                }
            }).catch(function(err) {
                reject({
                    success: false,
                    message: (err.status == 403 && err.message) || "System maintenance, please try again later!"
                });
            });
        }.bind(this));
    },
    register: function(name, password) {
        var apikey = uuid.v1();
        return new Promise(function(resolve, reject) {
            rp({
                method: "POST",
                uri: this.BaseURL + "register",
                formData: {
                    username: name,
                    password: password
                },
                json: true
            }).then(function(response) {
                if (response.data.success) {
                    const {username, apikey, isActivated, balance} = response.data;
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
                    message: (err.status == 409 && err.message) || "System maintenance, please try again later!"
                });
            });
        }.bind(this));
    }
};
module.exports = user;