
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/3.
 */
var rp = require("request-promise");
var config = require("./configuration");
var Pagination = require("../kit/pagination");

function contract(apikey) {
    this.apikey = apikey;
}
contract.prototype = {
    BaseURL: "http://" + config.RESTful_Server + config.RESTful_BaseURL,
    amount: function() {
        return new Promise(function(resolve, reject) {
            rp({
                uri: this.BaseURL + "sc/list?user_id=" + this.apikey,
                json: true
            }).then(function(response) {
                if (response.success) {
                    var contracts = response.result.contracts;
                    resolve({
                        success: true,
                        amount: contracts.length
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
    list: function(group, page) {
        return new Promise(function(resolve, reject) {
            rp({
                uri: this.BaseURL + "sc/list?user_id=" + this.apikey + "&group=" + group,
                json: true
            }).then(function(response) {
                if (response.success) {
                    var sc = [];
                    var contracts = response.result.contracts;
                    var pageNo = page || 1;
                    var pg = new Pagination(contracts);
                    contracts = pg.gotoPage(pageNo);
                    for (var i in contracts) {
                        sc.push({
                            id: contracts[i]["contract_id"],
                            group: contracts[i]["group"],
                            author: contracts[i]["author"],
                            name: contracts[i]["name"],
                            description: contracts[i]["description"].replace(/\n/g,"<br>"),
                            version: contracts[i]["version"],
                            deploy: contracts[i]["default_functions"]["deploy"] || []
                        });
                    }
                    resolve({
                        success: true,
                        contracts: sc,
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
    create: function(author, name, description, version, url) {
        return new Promise(function(resolve, reject) {
            rp({
                method: "POST",
                uri: this.BaseURL + "sc/upload",
                body: {
                    user_id: this.apikey,
                    author: author,
                    name: name,
                    description: description,
                    version: version,
                    get_url: url
                },
                json: true
            }).then(function(response) {
                if (response.success) {
                    var contract = response.result.contract;
                    resolve({
                        success: true,
                        id: contract.contract_id,
                        uploadTime: contract.upload_time
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
    deploy: function(chain, id, name, func, args) {
        return new Promise(function(resolve, reject) {
            rp({
                method: "POST",
                uri: this.BaseURL + "cluster/chaincode/deploy",
                body: {
                    cluster_id: chain,
                    contract_id: id,
                    name: name,
                    func: func,
                    args: JSON.parse(args)
                },
                json: true
            }).then(function(response) {
                if (response.success) {
                    var chaincode = response.result.deploy;
                    resolve({
                        success: true,
                        chaincodeId: chaincode.chaincode_id,
                        contractGroup: chaincode.contract_group,
                        deployTime: chaincode.deploy_time,
                        target: chaincode.target_node
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
    edit: function(id, name, description, version, author, url) {
        return new Promise(function(resolve, reject) {
            rp({
                method: "POST",
                uri: this.BaseURL + "sc/edit",
                body: url ?
                {
                    user_id: this.apikey,
                    contract_id: id,
                    author: author,
                    name: name,
                    description: description,
                    version: version,
                    get_url: url
                } : {
                    user_id: this.apikey,
                    contract_id: id,
                    author: author,
                    name: name,
                    description: description,
                    version: version
                },
                json: true
            }).then(function(response) {
                if (response.success) {
                    var contract = response.result.contract;
                    resolve({
                        success: true,
                        id: contract.contract_id,
                        editTime: contract.last_edit_time
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
    delete: function(id) {
        return new Promise(function(resolve, reject) {
            rp({
                method: "POST",
                uri: this.BaseURL + "sc/delete",
                body: {
                    user_id: this.apikey,
                    contract_id: id
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
    }
};
module.exports = contract;