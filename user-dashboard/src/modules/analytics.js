
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/12.
 */
var rp = require("request-promise");
var config = require("./configuration");
var dt = require("../kit/date-tool");

function analytics(chainId) {
    this.chainId = chainId;
}
analytics.prototype = {
    BaseURL: "http://" + config.RESTful_Server + config.RESTful_BaseURL,
    overview: function() {
        return new Promise(function(resolve, reject) {
            rp({
                uri: this.BaseURL + "analytics/overview?cluster_id=" + this.chainId,
                json: true
            }).then(function(response) {
                if (response.success) {
                    resolve({
                        success: true,
                        statistic: {
                            health: response.result.health,
                            chaincodes: response.result.chaincode_number,
                            blocks: response.result.block_number,
                            runTime: dt.parse(response.result.run_time)
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
                    message: (err.status == 503 && err.message) || "System maintenance, please try again later!"
                });
            });
        }.bind(this));
    },
    chaincodeList: function() {
        return new Promise(function(resolve, reject) {
            rp({
                uri: this.BaseURL + "analytics/chaincode/list?cluster_id=" + this.chainId,
                json: true
            }).then(function(response) {
                if (response.success) {
                    var chaincodes = response.result.chaincodes;
                    resolve({
                        success: true,
                        chaincodes: chaincodes
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
    chaincodeOperations: function(id, timestamp) {
        return new Promise(function(resolve, reject) {
            var api = "analytics/chaincode/operations?cluster_id=" + this.chainId + "&chaincode_id=" + id;
            if (timestamp) api += "&since_ts=" + timestamp;
            rp({
                uri: this.BaseURL + api,
                json: true
            }).then(function(response) {
                if (response.success) {
                    var operations = response.result.operations;
                    for (var i in operations) {
                        operations[i]["formattedTime"] = dt.format(Math.round(operations[i].timestamp * 1000), 0);
                    }
                    resolve({
                        success: true,
                        operations: operations
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
    fabric: function(timestamp) {
        return new Promise(function(resolve, reject) {
            var api = "analytics/fabric?cluster_id=" + this.chainId;
            if (timestamp) api += "&since_ts=" + timestamp;
            rp({
                uri: this.BaseURL + api,
                json: true
            }).then(function(response) {
                if (response.success) {
                    var blocks = response.result.blocks;
                    for (var i in blocks) {
                        blocks[i]["formattedTime"] = dt.format(Math.round(blocks[i].timestamp * 1000), 0);
                        blocks[i]["parsedTime"] = dt.parse2Str(blocks[i].block_time);
                    }
                    resolve({
                        success: true,
                        health: response.result.health,
                        blocks: blocks
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
    infrastructure: function(size) {
        return new Promise(function(resolve, reject) {
            rp({
                uri: this.BaseURL + "analytics/infrastructure?cluster_id=" + this.chainId + "&size=" + (size || 1),
                json: true
            }).then(function(response) {
                if (response.success) {
                    var statis = [];
                    var statistics = response.result.statistics;
                    for (var i in statistics) {
                        statis.push({
                            cpu_percentage: statistics[i]["cpu_percentage"],
                            memory_usage: statistics[i]["memory_usage"],
                            memory_limit: statistics[i]["memory_limit"],
                            memory_percentage: statistics[i]["memory_percentage"],
                            block_read: statistics[i]["block_read"],
                            block_write: statistics[i]["block_write"],
                            network_rx: statistics[i]["network_rx"],
                            network_tx: statistics[i]["network_tx"],
                            avg_latency: statistics[i]["avg_latency"],
                            timestamp: statistics[i]["timestamp"].substr(11)
                        });
                    }
                    resolve({
                        success: true,
                        health: response.result.health,
                        statistics: statis
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
module.exports = analytics;