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
                uri: this.BaseURL + "user/account/apikey/" + apikey,
                json: true
            }).then(function(response) {
                resolve({
                    success: true,
                    username: response.username,
                    apikey: response.apikey,
                    isActivated: response.isActivated,
                    balance: response.balance
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
                uri: this.BaseURL + "user/account/validate",
                body: {
                    username: name,
                    passwd: password
                },
                json: true
            }).then(function(response) {
                if (response.success) {
                    resolve({
                        success: true,
                        apikey: response.description
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
                uri: this.BaseURL + "user/account",
                body: {
                    username: name,
                    passwd: password,
                    apikey: apikey
                },
                json: true
            }).then(function(response) {
                if (response.success) {
                    resolve({
                        success: true,
                        apikey: apikey
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