
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/3.
 */
var rp = require("request-promise");
var config = require("./configuration");
var dt = require("../kit/date-tool");
var Pagination = require("../kit/pagination");

function chain(apikey) {
    this.apikey = apikey;
}
chain.prototype = {
    RESTfulURL: "http://" + config.RESTful_Server + config.RESTful_BaseURL,
    PoolManagerURL: "http://" + config.PoolManager_Server + config.PoolManager_BaseURL,
    LogURL: "http://" + config.Log_Server + config.Log_BaseURL,
    amount: function() {
        return new Promise(function(resolve, reject) {
            rp({
                uri: this.RESTfulURL + "cluster/list?user_id=" + this.apikey,
                json: true
            }).then(function(response) {
                if (response.success) {
                    var clusters = response.result.clusters;
                    resolve({
                        success: true,
                        amount: clusters.length
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
    list: function(page) {
        return new Promise(function(resolve, reject) {
            rp({
                uri: this.RESTfulURL + "cluster/list?user_id=" + this.apikey,
                json: true
            }).then(function(response) {
                if (response.success) {
                    var chains = [];
                    var clusters = response.result.clusters;
                    var pageNo = page || 1;
                    var pg = new Pagination(clusters);
                    clusters = pg.gotoPage(pageNo);
                    for (var i in clusters) {
                        var plugin = clusters[i]["consensus_plugin"];
                        var size = clusters[i]["size"];
                        var chaincodeNumber = clusters[i]["chaincodes"].length;
                        var cost = 0;
                        if (plugin == "noops") {
                            if (size == 4) {
                                cost = 40 + chaincodeNumber * 20;
                            } else if (size == 6) {
                                cost = 60 + chaincodeNumber * 30;
                            }
                        } else if (plugin == "pbft") {
                            if (size == 4) {
                                cost = 80 + chaincodeNumber * 40;
                            } else if (size == 6) {
                                cost = 120 + chaincodeNumber * 60;
                            }
                        }
                        chains.push({
                            id: clusters[i]["cluster_id"],
                            name: clusters[i]["name"],
                            description: clusters[i]["description"],
                            plugin: plugin,
                            mode: clusters[i]["consensus_mode"],
                            size: size,
                            run_time: dt.diff2Now(clusters[i]["apply_time"]),
                            status: clusters[i]["status"],
                            chaincodes: chaincodeNumber,
                            cost: cost
                        });
                    }
                    resolve({
                        success: true,
                        chains: chains,
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
    apply: function(name, description, plugin, mode, size) {
        return new Promise(function(resolve, reject) {
            rp({
                method: "POST",
                uri: this.RESTfulURL + "cluster/apply",
                body: {
                    user_id: this.apikey,
                    name: name,
                    description: description,
                    consensus_plugin: plugin,
                    consensus_mode: mode,
                    size: size
                },
                json: true
            }).then(function(response) {
                if (response.success) {
                    resolve({
                        success: true,
                        id: response.result.cluster_id,
                        applyTime: response.result.apply_time
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
    edit: function(id, name, description) {
        return new Promise(function(resolve, reject) {
            rp({
                method: "POST",
                uri: this.RESTfulURL + "cluster/edit",
                body: {
                    user_id: this.apikey,
                    cluster_id: id,
                    name: name,
                    description: description
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
                    message: (err.status == 503 && err.message) || "System maintenance, please try again later!"
                });
            });
        }.bind(this));
    },
    release: function(id) {
        return new Promise(function(resolve, reject) {
            rp({
                method: "POST",
                uri: this.RESTfulURL + "cluster/release",
                body: {
                    user_id: this.apikey,
                    cluster_id: id
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
                    message: (err.status == 503 && err.message) || "System maintenance, please try again later!"
                });
            });
        }.bind(this));
    },
    operate: function(id, action) {
        return new Promise(function(resolve, reject) {
            rp({
                method: "POST",
                uri: this.PoolManagerURL + "cluster_op",
                body: {
                    action: action,
                    cluster_id: id
                },
                json: true
            }).then(function(response) {
                if (response.status.toLowerCase() == "ok") {
                    resolve({ success: true });
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
    topologyNodes: function(id) {
        return new Promise(function(resolve, reject) {
            rp({
                uri: this.RESTfulURL + "cluster/topo/nodes?cluster_id=" + id,
                json: true
            }).then(function(response) {
                if (response.success) {
                    var nodes = response.result.nodes;
                    var features = [];
                    for (var i in nodes) {
                        features.push({
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: config["topology"][nodes[i]["id"]]
                            },
                            properties: nodes[i]
                        });
                    }
                    resolve({
                        success: true,
                        geoData: {
                            type: "FeatureCollection",
                            features: features
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
    topologyLinks: function(id) {
        return new Promise(function(resolve, reject) {
            rp({
                uri: this.RESTfulURL + "cluster/topo/links?cluster_id=" + id,
                json: true
            }).then(function(response) {
                if (response.success) {
                    var links = response.result.links;
                    var features = [];
                    for (var i in links) {
                        features.push({
                            type: "Feature",
                            geometry: {
                                type: "LineString",
                                coordinates: [
                                    config["topology"][links[i]["from"]],
                                    config["topology"][links[i]["to"]]
                                ]
                            },
                            properties: links[i]
                        });
                    }
                    resolve({
                        success: true,
                        geoData: {
                            type: "FeatureCollection",
                            features: features
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
    topologyLatency: function(id) {
        return new Promise(function(resolve, reject) {
            rp({
                uri: this.RESTfulURL + "cluster/topo/links?cluster_id=" + id,
                json: true
            }).then(function(response) {
                if (response.success) {
                    var links = response.result.links;
                    resolve({
                        success: true,
                        links: links
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
    logNodes: function(id) {
        return new Promise(function(resolve, reject) {
            rp({
                uri: this.RESTfulURL + "cluster/topo/nodes?cluster_id=" + id,
                json: true
            }).then(function(response) {
                if (response.success) {
                    var nodes = response.result.nodes;
                    var n = [];
                    for (var i in nodes) {
                        n.push({
                            id: nodes[i]["id"],
                            type: "peer"
                        });
                    }
                    n.sort(function(n1, n2) {
                        if (n1.id < n2.id) return -1;
                        else if (n1.id > n2.id) return 1;
                        else return 0;
                    });
                    n.push({
                        id: "chaincode",
                        type: "chaincode"
                    });
                    resolve({
                        success: true,
                        nodes: n
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
    log: function(id, type, node, size, time) {
        return new Promise(function(resolve, reject) {
            rp({
                uri: this.LogURL + "?" +
                    "cluster_id=" + id + "&" +
                    "log_type=" + type + "&" +
                    "node_name=" + node + "&" +
                    "log_size=" + (size || 1) +
                    (time ? "&since_ts=" + time : ""),
                json: true
            }).then(function(response) {
                if (response.code == 0) {
                    resolve({
                        success: true,
                        logs: response.data.logs,
                        latest_ts: response.data.latest_ts
                    });
                } else {
                    var e = new Error(response.message.body.error ?
                        response.message.body.error.reason : response.message.code);
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
    blocks: function(id) {
        return new Promise(function(resolve, reject) {
            rp({
                uri: this.RESTfulURL + "cluster/ledger/chain?cluster_id=" + id,
                json: true
            }).then(function(response) {
                if (response.success) {
                    var blockchain = response.result.chain;
                    resolve({
                        success: true,
                        height: blockchain.height
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
    block: function(chainId, blockId) {
        return new Promise(function(resolve, reject) {
            rp({
                uri: this.RESTfulURL + "cluster/ledger/block?cluster_id=" + chainId + "&block_id=" + blockId,
                json: true
            }).then(function(response) {
                if (response.success) {
                    var block = response.result.block;
                    var transactions = block.transactions || [];
                    var trans = [];
                    for (var i in transactions) {
                        var type = transactions[i]["type"];
                        trans.push({
                            chaincodeId: transactions[i]["chaincodeID"],
                            type: type == "1" ? "Deploy" : type == "2" ? "Invoke" : "Query",
                            payload: transactions[i]["payload"],
                            timestamp: dt.format(transactions[i]["timestamp"]["seconds"] * 1000),
                            uuid: transactions[i]["uuid"]
                        });
                    }
                    resolve({
                        success: true,
                        transactions: trans,
                        commitTime: dt.format(block["nonHashData"]["localLedgerCommitTimestamp"]["seconds"] * 1000)
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
module.exports = chain;