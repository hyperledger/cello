
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/10.
 */
var rp = require("request-promise");
var config = require("./configuration");
var Pagination = require("../kit/pagination");
var dt = require("../kit/date-tool");

function chaincode(chainId) {
    this.chainId = chainId;
}
chaincode.prototype = {
    RESTfulURL: "http://" + config.RESTful_Server + config.RESTful_BaseURL,
    PoolManagerURL: "http://" + config.PoolManager_Server + config.PoolManager_BaseURL,
    list: function(page) {
        return new Promise(function(resolve, reject) {
            rp({
                uri: this.RESTfulURL + "cluster/chaincode/deployed?cluster_id=" + this.chainId,
                json: true
            }).then(function(response) {
                if (response.success) {
                    var cc = [];
                    var chain = response.result.cluster_info;
                    var chaincodes = response.result.chaincodes;
                    var pageNo = page || 1;
                    var pg = new Pagination(chaincodes);
                    chaincodes = pg.gotoPage(pageNo);
                    for (var i in chaincodes) {
                        cc.push({
                            id: chaincodes[i]["chaincode_id"],
                            name: chaincodes[i]["chaincode_name"],
                            contract: {
                                id: chaincodes[i]["contract_id"],
                                name: chaincodes[i]["contract_name"],
                                invoke: chaincodes[i]["contract_default_functions"]["invoke"] || [],
                                query: chaincodes[i]["contract_default_functions"]["query"] || []
                            },
                            deployTime: dt.diff2Now(chaincodes[i]["deploy_time"])
                        });
                    }
                    resolve({
                        success: true,
                        chain: {
                            name: chain["cluster_name"],
                            description: chain["cluster_description"]
                        },
                        chaincodes: cc,
                        totalNumber: pg.getTotalRow(),
                        totalPage: pg.getTotalPage()
                    });
                } else {
                    var e = new Error(response.message);
                    e.status = 503;
                    throw e;
                }
            }).catch(function(err) {
                reject({
                    success: false,
                    message: (err.status == 503 && err.message) || "System maintenance, please try again later!"
                });
            });
        }.bind(this));
    },
    getAPIs: function() {
        return new Promise(function(resolve, reject) {
            rp({
                uri: this.PoolManagerURL + "cluster/" + this.chainId,
                json: true
            }).then(function(response) {
                if (response.status.toLowerCase() == "ok") {
                    var serviceUrl = response.data.service_url;
                    delete serviceUrl["ecaa"];
                    delete serviceUrl["ecap"];
                    delete serviceUrl["tcaa"];
                    delete serviceUrl["tcap"];
                    delete serviceUrl["tlscaa"];
                    delete serviceUrl["tlscap"];
                    resolve({
                        success: true,
                        serviceUrl: serviceUrl
                    });
                } else {
                    var e = new Error(response.error);
                    e.status = 503;
                    throw e;
                }
            }).catch(function(err) {
                reject({
                    success: false,
                    message: (err.status == 503 && err.message) || "System maintenance, please try again later!"
                });
            });
        }.bind(this));
    },
    invoke: function(id, func, args) {
        return new Promise(function(resolve, reject) {
            rp({
                method: "POST",
                uri: this.RESTfulURL + "cluster/chaincode/invoke",
                body: {
                    cluster_id: this.chainId,
                    chaincode_id: id,
                    func: func,
                    args: JSON.parse(args)
                },
                json: true
            }).then(function(response) {
                if (response.success) {
                    resolve(response);
                } else {
                    var e = new Error(response.message);
                    e.status = 503;
                    throw e;
                }
            }).catch(function(err) {
                reject({
                    success: false,
                    message: (err.status == 503 && err.message) || "System maintenance, please try again later!"
                });
            });
        }.bind(this));
    },
    query: function(id, func, args) {
        return new Promise(function(resolve, reject) {
            rp({
                method: "POST",
                uri: this.RESTfulURL + "cluster/chaincode/query",
                body: {
                    cluster_id: this.chainId,
                    chaincode_id: id,
                    func: func,
                    args: JSON.parse(args)
                },
                json: true
            }).then(function(response) {
                if (response.success) {
                    var result = response.result.response;
                    resolve({
                        success: true,
                        result: result
                    });
                } else {
                    var e = new Error(response.message);
                    e.status = 503;
                    throw e;
                }
            }).catch(function(err) {
                reject({
                    success: false,
                    message: (err.status == 503 && err.message) || "System maintenance, please try again later!"
                });
            });
        }.bind(this));
    }
};
module.exports = chaincode;