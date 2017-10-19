
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/3.
 */
var rp = require("request-promise");
var config = require("./configuration");

function profile(apikey) {
    this.apikey = apikey;
}
profile.prototype = {
    BaseURL: "http://" + config.RESTful_Server + config.RESTful_BaseURL,
    init: function() {
        return new Promise(function(resolve, reject) {
            rp({
                method: "POST",
                uri: this.BaseURL + "user/init",
                body: {
                    user_id: this.apikey
                },
                json: true
            }).then(function(response) {
                if (response.success) {
                    resolve({ success: true });
                } else {
                    var e = new Error(response.message);
                    e.status = 503;
                    throw e;
                }
            }).catch(function(err) {
                reject({
                    success: false,
                    message: (err.status === 503 && err.message) || "System maintenance, please try again later!"
                });
            });
        }.bind(this));
    },
    load: function() {
        return new Promise(function(resolve, reject) {
            rp({
                uri: this.BaseURL + "profile/" + this.apikey,
                json: true
            }).then(function(response) {
                if (response.success) {
                    resolve({
                        success: true,
                        result: {
                            name: response.result.name,
                            email: response.result.email,
                            bio: response.result.bio,
                            url: response.result.url,
                            location: response.result.location
                        }
                    });
                } else {
                    var e = new Error(response.message);
                    e.status = 503;
                    throw e;
                }
            }).catch(function(err) {
                reject({
                    success: false,
                    message: (err.status === 503 && err.message) || "System maintenance, please try again later!"
                });
            });
        }.bind(this));
    },
    update: function(name, email, bio, url, location) {
        return new Promise(function(resolve, reject) {
            rp({
                method: "PUT",
                uri: this.BaseURL + "profile/" + this.apikey,
                formData: {
                    name: name,
                    email: email,
                    bio: bio,
                    url: url,
                    location: location
                },
                json: true
            }).then(function(response) {
                if (response.success) {
                    resolve({ success: true });
                } else {
                    var e = new Error(response.message);
                    e.status = 503;
                    throw e;
                }
            }).catch(function(err) {
                reject({
                    success: false,
                    message: (err.status === 503 && err.message) || "System maintenance, please try again later!"
                });
            });
        }.bind(this));
    }
};
module.exports = profile;