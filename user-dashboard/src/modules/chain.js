
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/3.
 */
var rp = require("request-promise");
var configuration = require("./configuration");
var dt = require("../kit/date-tool");
var Pagination = require("../kit/pagination");
import Moment from 'moment'
import { extendMoment } from 'moment-range';
import util from 'util'
import config from '../config'
import sleep from 'sleep-promise';
const crypto = require("crypto");
const mongoose = require('mongoose');
const moment = extendMoment(Moment);
const log4js = require('log4js');
const logger = log4js.getLogger(__filename.slice(__dirname.length + 1));
const logLevel = process.env.DEV === "True" ? "DEBUG" : "INFO"
import ChainModel from '../models/chain'
import ChainCode from '../models/chainCode'
logger.setLevel(logLevel);

function chain(apikey, username) {
    this.apikey = apikey;
    this.username = username;
}
chain.prototype = {
    RESTfulURL: "http://" + configuration.RESTful_Server + configuration.RESTful_BaseURL,
    PoolManagerURL: "http://" + configuration.PoolManager_Server + configuration.PoolManager_BaseURL,
    LogURL: "http://" + configuration.Log_Server + configuration.Log_BaseURL,
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
                    message: (err.status === 503 && err.message) || "System maintenance, please try again later!"
                });
            });
        }.bind(this));
    },
    list: function(page) {
        const username = this.username
        const userId = this.apikey
        return new Promise(function(resolve, reject) {
            rp({
                uri: this.RESTfulURL + "clusters?user_id=" + this.apikey,
                json: true
            }).then(function(response) {
              if (response.status === "OK") {
                let chains = [];
                let clusters = response.data;
                const pageNo = page || 1;
                const pg = new Pagination(clusters);
                clusters = pg.gotoPage(pageNo);
                let promises = []
                clusters.forEach((cluster, i) => {
                  const plugin = cluster.consensus_plugin
                  const size = cluster.size
                  let p = new Promise((resolve, reject) => {
                      ChainModel.findOne({clusterId: cluster.id, user_id: userId}, function (err, chainDoc) {
                        const peers = cluster.containers.filter(container => container.includes(".peer"))
                        const applyTime = moment(cluster.apply_ts)
                        const nowTime = moment().add(8, "hours")
                        let runningHours = moment.range(applyTime, nowTime).diff("hours")
                        ChainCode.count({chain: chainDoc, status: "instantiated"}, function (err, result) {
                          chains.push({
                            id: cluster.id,
                            dbId: chainDoc.id,
                            blocks: 0,
                            scNum: result,
                            initialized: chainDoc.initialized,
                            keyValueStore: chainDoc.keyValueStore,
                            status: chainDoc.initialized ? cluster.status : "initializing",
                            plugin,
                            size,
                            name: chainDoc.name,
                            template: chainDoc.template,
                            type: chainDoc.type,
                            peerNum: peers.length,
                            createTime: applyTime.format("YYYY/MM/DD HH:mm:ss"),
                            runningHours
                          });
                          resolve()
                        })
                      })
                  })
                  promises.push(p)
                });
                function asyncQuery(arr) {
                  return arr.reduce((promise, chain) => {
                    return promise.then((result) => {
                      return new Promise((resolve, reject) => {
                        const chainRootDir = util.format(config.path.chain, username, chain.dbId)
                        if (chain.initialized) {
                          const helper = require(`${chainRootDir}/lib/helper`)
                          helper.initialize(chain.template)
                          helper.setupChaincodeDeploy()
                          const query = require(`${chainRootDir}/lib/query`)
                          query.initialize(chain.template)
                          query.getChannelHeight("peer1", username, "org1")
                            .then(function(message) {
                              const chainIndex = chains.findIndex(x => x.id === chain.id);
                              let chainItem = chains[chainIndex]
                              chainItem.blocks = parseInt(message)
                              chains[chainIndex] = chainItem
                            }).then(sleep(500)).then(() => {
                            resolve()
                          })
                        } else {
                          resolve()
                        }
                      })
                    })
                  }, Promise.resolve())
                }
                Promise.all(promises).then(() => {
                  asyncQuery(chains).then(() => {
                    resolve({
                      success: true,
                      chains: chains,
                      totalNumber: pg.getTotalRow(),
                      totalPage: pg.getTotalPage()
                    });
                  })
                })
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
    apply: function(name, plugin, mode, size, applyType) {
        return new Promise(function(resolve, reject) {
            const apikey = this.apikey
            const username = this.username
            rp({
                method: "POST",
                uri: this.RESTfulURL + "cluster_op",
                body: {
                    user_id: this.apikey,
                    action: "apply",
                    type: applyType,
                    size: size
                },
                json: true
            }).then(function(response) {
                if (response.status === "OK") {
                  const {data: {service_url, size}} = response
                  const chainId = mongoose.Types.ObjectId();
                  const chainRootDir = util.format(config.path.chain, username, chainId)
                  const newChain = new ChainModel({
                    _id: chainId,
                    keyValueStore: `${chainRootDir}/client-kvs`,
                    ccSrcPath: chainRootDir,
                    serviceUrl: service_url,
                    user_id: apikey,
                    username,
                    name,
                    size,
                    plugin,
                    mode,
                    type: applyType,
                    clusterId: response.data.id
                  })
                  newChain.save(function(err, data){
                    if(err){ return console.log(err) }
                  })
                  resolve({
                    success: true,
                    id: response.data.id,
                    dbId: newChain.id,
                    applyTime: response.data.apply_ts
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
    edit: function(id, name) {
        return new Promise(function(resolve, reject) {
          try {
            const query = {clusterId: id};
            ChainModel.findOneAndUpdate(query, {name}, {upsert: true}, function (err, doc) {
              if (err) {
                logger.error(err)
                err.status = 503;
                throw err;
              } else {
                resolve({success: true})
              }
            })
          } catch (err) {
            reject({
              success: false,
              message: (err.status === 503 && err.message) || "System maintenance, please try again later!"
            });
          }
            // rp({
            //     method: "POST",
            //     uri: this.RESTfulURL + "cluster/edit",
            //     body: {
            //         user_id: this.apikey,
            //         cluster_id: id,
            //         name: name,
            //         description: description
            //     },
            //     json: true
            // }).then(function(response) {
            //     if (response.success) {
            //         resolve({ success: true });
            //     } else {
            //         var e = new Error(response.message);
            //         e.status = 503;
            //         throw e;
            //     }
            // }).catch(function(err) {
            //     reject({
            //         success: false,
            //         message: (err.status == 503 && err.message) || "System maintenance, please try again later!"
            //     });
            // });
        }.bind(this));
    },
    release: function(id) {
        return new Promise(function(resolve, reject) {
            rp({
                method: "POST",
                uri: this.RESTfulURL + "cluster_op",
                body: {
                    action: "release",
                    user_id: this.apikey,
                    cluster_id: id
                },
                json: true
            }).then(function(response) {
                if (response.status === "OK") {
                  ChainModel.findOne({clusterId: id}, function (err, doc) {
                    if (err) {
                      err.status = 503;
                      throw err;
                    } else {
                      doc.remove(function(err){logger.error(err)});
                      resolve({success: true})
                    }
                  })
                } else {
                    let e = new Error(response.message);
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
                if (response.status.toLowerCase() === "ok") {
                    resolve({ success: true });
                } else {
                    var e = new Error(response.error);
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
                                coordinates: configuration["topology"][nodes[i]["id"]]
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
                                    configuration["topology"][links[i]["from"]],
                                    configuration["topology"][links[i]["to"]]
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