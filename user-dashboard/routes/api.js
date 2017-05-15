/**
 * Created by lixuc on 2017/5/2.
 */
var express = require("express");
var multer  = require("multer");
var GridFsStorage = require("multer-gridfs-storage");
var config = require("../modules/configuration");
var User = require("../modules/user");
var Profile = require("../modules/profile");
var Chain = require("../modules/chain");
var Chaincode = require("../modules/chaincode");
var mongoClient = require("../modules/mongoclient");
var Contract = require("../modules/contract");
var Analytics = require("../modules/analytics");

var router = express.Router();

router.post("/login", function(req, res) {
    var user = new User();
    user.validate(req.body.username, req.body.password).then(function(result) {
        return user.account(result.apikey);
    }).then(function(result) {
        var userInfo = {
            username: result.username,
            apikey: result.apikey,
            isActivated: result.isActivated
        };
        //将用户的blue points保存到session中，有效期24小时
        req.session.balance = result.balance;
        //将用户信息保存到cookie，如果remember me，保存一年
        if (req.body.rememberme == "true") {
            res.cookie(config.cookieName, JSON.stringify(userInfo), {
                maxAge: 365*24*60*60*1000
            });
        } else {
            res.cookie(config.cookieName, JSON.stringify(userInfo));
        }
        res.json(Object.assign(userInfo, { success: true }));
    }).catch(function(err) {
        res.json(err);
    });
});
router.post("/register", function(req, res) {
    var user = new User();
    user.register(req.body.username, req.body.password).then(function(result) {
        return user.account(result.apikey);
    }).then(function(result) {
        var userInfo = {
            username: result.username,
            apikey: result.apikey,
            isActivated: result.isActivated
        };
        //将用户的blue points保存到session中，有效期24小时
        req.session.balance = result.balance;
        //将用户信息暂存到cookie
        res.cookie(config.cookieName, JSON.stringify(userInfo));
        res.json(Object.assign(userInfo, { success: true }));
    }).catch(function(err) {
        res.json(err);
    });
});
router.get("/:apikey/profile", function(req, res) {
    var profile = new Profile(req.params.apikey);
    profile.load().then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.post("/:apikey/profile/update", function(req, res) {
    var profile = new Profile(req.params.apikey);
    profile.update(req.body.name,
                   req.body.email,
                   req.body.bio,
                   req.body.url,
                   req.body.location)
    .then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.get("/:apikey/chain/list", function(req, res) {
    var chain = new Chain(req.params.apikey);
    chain.list(req.query.page).then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.post("/:apikey/chain/apply", function(req, res) {
    var chain = new Chain(req.params.apikey);
    chain.apply(req.body.name,
                req.body.description,
                req.body.plugin,
                req.body.mode,
                req.body.size)
    .then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.post("/:apikey/chain/:id/edit", function(req, res) {
    var chain = new Chain(req.params.apikey);
    chain.edit(req.params.id, req.body.name, req.body.description).then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.post("/:apikey/chain/:id/release", function(req, res) {
    var chain = new Chain(req.params.apikey);
    chain.release(req.params.id).then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.get("/chain/:id/operate", function(req, res) {
    var chain = new Chain();
    chain.operate(req.params.id, req.query.action).then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.get("/chain/:id/topology", function(req, res) {
    var topology = {};
    var chain = new Chain();
    chain.topologyNodes(req.params.id).then(function(result) {
        topology["nodes"] = result["geoData"];
        return chain.topologyLinks(req.params.id);
    }).then(function(result) {
        topology["links"] = result["geoData"];
        res.json(Object.assign(topology, { success: true }));
    }).catch(function(err) {
        res.json(err);
    });
});
router.get("/chain/:id/topology/latency", function(req, res) {
    var chain = new Chain();
    chain.topologyLatency(req.params.id).then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.get("/chain/:id/log/nodes", function(req, res) {
    var chain = new Chain();
    chain.logNodes(req.params.id).then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.get("/chain/:id/log", function(req, res) {
    var chain = new Chain();
    chain.log(req.params.id,
              req.query.type,
              req.query.node,
              req.query.size,
              req.query.time)
    .then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.get("/chain/:id/blocks", function(req, res) {
    var chain = new Chain();
    chain.blocks(req.params.id).then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.get("/chain/:chainId/block/:blockId", function(req, res) {
    var chain = new Chain();
    chain.block(req.params.chainId, req.params.blockId).then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.get("/chain/:id/chaincode/list", function(req, res) {
    var chaincode = new Chaincode(req.params.id);
    chaincode.list(req.query.page).then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.post("/chain/:id/chaincode/invoke", function(req, res) {
    var chaincode = new Chaincode(req.params.id);
    chaincode.invoke(req.body.id,
                     req.body.func,
                     req.body.args)
    .then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.post("/chain/:id/chaincode/query", function(req, res) {
    var chaincode = new Chaincode(req.params.id);
    chaincode.query(req.body.id,
                    req.body.func,
                    req.body.args)
    .then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.post("/:apikey/contract/upload", function(req, res) {
    mongoClient.getGridFS().then(function(gfs) {
        return new Promise(function(resolve, reject) {
            var storage = GridFsStorage({
                gfs: gfs,
                root: "smartcontract",
                filename: function(req, file, cb) {
                    cb(null, file.originalname);
                },
                metadata: function(req, file, cb) {
                    cb(null, { apikey: req.params.apikey });
                }
            });
            var upload = multer({ storage: storage }).single("smartcontract");
            upload(req, res, function (err) {
                if (err) {
                    reject(err);
                } else {
                    res.json({
                        result: true,
                        name: req.file.filename,
                        url: req.baseUrl + "/contract?id=" + req.file.id
                    })
                }
            });
        });
    }).catch(function(err) {
        res.json({
            result: false,
            message: err.name + ": " + err.message
        });
    });
});
router.get("/contract", function(req, res) {
    mongoClient.getGridFS().then(function(gfs) {
        return new Promise(function(resolve, reject) {
            var readstream = gfs.createReadStream({
                _id: req.query.id,
                root: "smartcontract"
            });
            readstream.on("error", function (err) {
                reject(err);
            });
            readstream.pipe(res);
        });
    }).catch(function(err) {
        res.json({
            result: false,
            message: err.name + ": " + err.message
        });
    });
});
router.post("/:apikey/contract/create", function(req, res) {
    var contract = new Contract(req.params.apikey);
    contract.create(req.body.author,
                    req.body.name,
                    req.body.description,
                    req.body.version,
                    req.body.url)
    .then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.get("/:apikey/contract/list/:group", function(req, res) {
    var contract = new Contract(req.params.apikey);
    contract.list(req.params.group, req.query.page).then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.get("/:apikey/contract/list", function(req, res) {
    var contracts = {};
    var contract = new Contract(req.params.apikey);
    contract.list("public", -1).then(function(result) {
        contracts["public"] = result.contracts;
        return contract.list("private", -1);
    }).then(function(result) {
        contracts["private"] = result.contracts;
        res.json(Object.assign(contracts, { success: true }));
    }).catch(function(err) {
        res.json(err);
    });
});
router.post("/contract/:id/deploy", function(req, res) {
    var contract = new Contract();
    contract.deploy(req.body.chain,
                    req.params.id,
                    req.body.name,
                    req.body.func,
                    req.body.args)
    .then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.post("/:apikey/contract/:id/edit", function(req, res) {
    var contract = new Contract(req.params.apikey);
    contract.edit(req.params.id,
                  req.body.name,
                  req.body.description,
                  req.body.version,
                  req.body.author,
                  req.body.url)
    .then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.post("/:apikey/contract/:id/delete", function(req, res) {
    var contract = new Contract(req.params.apikey);
    contract.delete(req.params.id).then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.get("/chain/:id/analytics", function(req, res) {
    var analytics = new Analytics(req.params.id);
    analytics.overview().then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.get("/chain/:id/analytics/chaincode/list", function(req, res) {
    var analytics = new Analytics(req.params.id);
    analytics.chaincodeList().then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.get("/chain/:chainId/analytics/chaincode/:chaincodeId/operations", function(req, res) {
    var analytics = new Analytics(req.params.chainId);
    analytics.chaincodeOperations(req.params.chaincodeId, req.query.timestamp).then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.get("/chain/:id/analytics/fabric", function(req, res) {
    var analytics = new Analytics(req.params.id);
    analytics.fabric(req.query.timestamp).then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.get("/chain/:id/analytics/infrastructure", function(req, res) {
    var analytics = new Analytics(req.params.id);
    analytics.infrastructure(req.query.size).then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
module.exports = router;