
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
*/
import { Router } from 'express'
const Chain = require("../../../modules/chain");
import ChainModel from '../../../models/chain'
import ChainCode from '../../../models/chainCode'
import util from 'util'
import config from '../../../config'
import Moment from 'moment'
import { extendMoment } from 'moment-range';
const moment = extendMoment(Moment);
const log4js = require('log4js');
const logger = log4js.getLogger(__filename.slice(__dirname.length + 1));
const logLevel = process.env.DEV === "True" ? "DEBUG" : "INFO"
logger.setLevel(logLevel);

const router = new Router()

router.get("/:apikey/list", function(req, res) {
  const chain = new Chain(req.apikey, req.username);
  chain.list(req.query.page).then(function(result) {
    res.json({
      ...result,
      limit: config.limit.chainNumber
    });
  }).catch(function(err) {
    res.json(err);
  });
});

router.get("/search", function (req, res) {
  const chainName = req.query.name;
  ChainModel.count({user_id: req.apikey, name: chainName}, function (err, result) {
    res.json({
      success: true,
      existed: result>0
    })
  })
})

router.get("/:apikey/db-list", function (req, res) {
  ChainModel.find({user_id: req.apikey}, function (err, docs) {
    if (err) res.json({success: false, err})
    const chains = docs.map((chain, i) => {
      return {
        id: chain.id,
        name: chain.name,
        type: chain.type
      }
    })
    res.json({
      success: true,
      chains
    })
  })
})

router.get("/:id/stat", function (req, res) {
  const id = req.params.id;
  ChainModel.findOne({id}, function (err, chainDoc) {
    if (err) res.json({success: false})
    res.json({
      success: true,
      id,
      initialized: chainDoc.initialized
    })
  })
})
router.post("/:apikey/apply", function(req, res) {
  const chain = new Chain(req.apikey, req.username);
  chain.apply(
    req.body.name,
    '',
    '',
    req.body.config.size,
    req.body.type
  ).then(function (result) {
    res.json(result)
  }).catch(function (err) {
    res.json(err)
  })
  // chain.apply(req.body.name,
  //   req.body.description,
  //   req.body.plugin,
  //   req.body.mode,
  //   req.body.size)
  //   .then(function(result) {
  //     res.json(result);
  //   }).catch(function(err) {
  //   res.json(err);
  // });
});
router.post("/:apikey/:id/release", function(req, res) {
  const chain = new Chain(req.apikey, req.username);
  chain.release(req.params.id).then(function(result) {
    res.json(result);
  }).catch(function(err) {
    res.json(err);
  });
});
router.post("/:apikey/:id/edit", function(req, res) {
  const chain = new Chain(req.apikey, req.username);
  chain.edit(req.params.id, req.body.name).then(function(result) {
    res.json(result);
  }).catch(function(err) {
    res.json(err);
  });
});

router.get("/:id/blockHeight", function (req, res) {
  const chainId = req.params.id;
  ChainModel.findOne({_id: chainId}, function (err, chain) {
    const chainRootDir = util.format(config.path.chain, req.username, chainId)
    const helper = require(`${chainRootDir}/lib/helper`)
    helper.initialize(chain.template)
    const query = require(`${chainRootDir}/lib/query`)
    query.getChannelHeight('peer1', req.username, 'org1')
      .then(function(message) {
        res.json({
          success: true,
          height: parseInt(message)
        })
      });
  })
})

router.get("/:id/channels", function (req, res) {
  const chainId = req.params.id;
  ChainModel.findOne({_id: chainId}, function (err, chain) {
    const chainRootDir = util.format(config.path.chain, req.username, chainId)
    const query = require(`${chainRootDir}/lib/query`)
    query.initialize(chain.template)
    query.getChannels('peer1', req.username, 'org1')
      .then(function(message) {
        res.send({
          success: true,
          ...message
        });
      }, (err) => {
        res.send({
          success: false,
          channels: [],
          error: err.stack ? err.stack : err
        })
      }).catch((err) => {
      res.send({
        success: false,
        channels: [],
        error: err.stack ? err.stack : err
      })
    });
  })
})

router.get("/:id/recentBlock", function (req, res) {
  const chainId = req.params.id;
  const blockHeight = parseInt(req.query.blockHeight);
  let recentNum = parseInt(req.query.recentNum);
  recentNum = recentNum > blockHeight ? blockHeight : recentNum;
  let blockIds = []
  for (let index=blockHeight-1; index>=blockHeight-recentNum; index--) {
    blockIds.push(index)
  }
  let allBlocks = []
  ChainModel.findOne({_id: chainId}, function (err, chain) {
    let promises = []
    for (let index in blockIds) {
      const blockId = blockIds[index];
      let p = new Promise((resolve, reject) => {
        const chainRootDir = util.format(config.path.chain, req.username, chainId)
        const query = require(`${chainRootDir}/lib/query`)
        query.initialize(chain.template)
        query.getBlockByNumber('peer1', blockId, req.username, 'org1')
          .then(function (message) {
            const {header: {data_hash}} = message;
            let txTimestamps = []
            message.data.data.map((item, index) => {
              const {payload: {header: {channel_header: {tx_id, timestamp, channel_id}}}} = item;
              const txTime = moment(timestamp, "ddd MMM DD YYYY HH:mm:ss GMT+0000 (UTC)")
              txTimestamps.push(txTime.utc())
            })
            txTimestamps = txTimestamps.sort(function (a, b) {  return a - b;  });
            allBlocks.push({
              id: blockId,
              hash: data_hash,
              transactions: message.data.data.length,
              timestamp: txTimestamps.slice(-1).pop()
            })
            resolve()
          })
      })
      promises.push(p)
    }
    Promise.all(promises).then(() => {
      res.json({success: true, allBlocks})
    })
  })
})

router.get("/:id/recentTransaction", function (req, res) {
  const chainId = req.params.id;
  const blockHeight = parseInt(req.query.blockHeight);
  let recentNum = parseInt(req.query.recentNum);
  recentNum = recentNum > blockHeight ? blockHeight : recentNum;
  let blockIds = []
  for (let index=blockHeight-1; index>=blockHeight-recentNum; index--) {
    blockIds.push(index)
  }
  let allTransactions = []
  ChainModel.findOne({_id: chainId}, function (err, chain) {
    let promises = []
    for (let index in blockIds) {
      const blockId = blockIds[index];
      let p = new Promise((resolve, reject) => {
        const chainRootDir = util.format(config.path.chain, req.username, chainId)
        const query = require(`${chainRootDir}/lib/query`)
        query.initialize(chain.template)
        query.getBlockByNumber('peer1', blockId, req.username, 'org1')
          .then(function (message) {
            message.data.data.map((item, index) => {
              const {payload: {header: {channel_header: {tx_id, timestamp, channel_id}}}} = item;
              const txTime = moment(timestamp, "ddd MMM DD YYYY HH:mm:ss GMT+0000 (UTC)")
              if (tx_id) {
                allTransactions.push({
                  id: tx_id,
                  timestamp: txTime.utc(),
                  channelId: channel_id
                })
              }
            })
            resolve()
          })
      })
      promises.push(p)
    }
    Promise.all(promises).then(() => {
      res.json({success: true, allTransactions})
    })
  })
})

router.get("/:id/queryByBlockId", function (req, res) {
  const blockId = req.query.id;
  const chainId = req.params.id;
  ChainModel.findOne({_id: chainId}, function (err, chain) {
    const chainRootDir = util.format(config.path.chain, req.username, chainId)
    const query = require(`${chainRootDir}/lib/query`)
    query.initialize(chain.template)
    query.getBlockByNumber('peer1', blockId, req.username, 'org1')
      .then(function(message) {
        let txList = []
        message.data.data.map((item, index) => {
          const {payload: {header: {channel_header: {tx_id, timestamp, channel_id}}}} = item;
          const txTime = moment(timestamp, "ddd MMM DD YYYY HH:mm:ss GMT+0000 (UTC)")
          txList.push({
            id: tx_id,
            timestamp: txTime.unix(),
            channelId: channel_id
          })
        })
        res.send({
          success: true,
          txList
        });
      }, (err) => {
        res.json({
          success: false,
          error: err.stack ? err.stack : err
        })
      }).catch((err) => {
        res.json({
          success: false,
          txList: [],
          error: err.stack ? err.stack : err
        })
    });
  })
})

router.get("/:id/queryByTransactionId", function (req, res) {
  const trxnId = req.query.id;
  const chainId = req.params.id;
  ChainModel.findOne({_id: chainId}, function (err, chain) {
    const chainRootDir = util.format(config.path.chain, req.username, chainId)
    const query = require(`${chainRootDir}/lib/query`)
    query.initialize(chain.template)
    query.getTransactionByID('peer1', trxnId, req.username, 'org1')
      .then(function(message) {
        logger.debug(`message ${JSON.stringify(message, null, 2)}`)
        const {transactionEnvelope: {payload: {header: {channel_header: {type}}}}, validationCode} = message
        // const action = actions.length ? actions[0] : {}
        // const {payload: {chaincode_proposal_payload: {input: {chaincode_spec: {type, chaincode_id: {name}, input: {args}}}}}} = action
        res.json({
          success: true,
          validationCode,
          type
          // name
          // args
        })
      }, (err) => {
        res.json({
          success: false,
          error: err.stack ? err.stack : err
        })
      }).catch((err) => {
      res.json({
        success: false,
        error: err.stack ? err.stack : err
      })
    });
  })
})

router.get("/:id/chainCodes", function (req, res) {
  const chainId = req.params.id;
  let allChainCodes = []
  ChainModel.findOne({_id: chainId}, function (err, chain) {
    const chainRootDir = util.format(config.path.chain, req.username, chainId)
    const query = require(`${chainRootDir}/lib/query`)
    query.initialize(chain.template)
    query.getInstalledChaincodes('peer1', 'instantiated', req.username, 'org1')
      .then(function(message) {
        let promises = []
        for (let index in message) {
          const chainCodeString = message[index];
          let l = chainCodeString.slice(0,-1).split(',');
          let chainCode = {};
          for (let i in l) {
            let a = l[i].split(':');
            logger.debug(`key ${a[0]} ${a[1]}`)
            chainCode[a[0].trim()] = a[1].trim();
          }
          let p = new Promise((resolve, reject) => {
            logger.debug(`chain code name ${chainCode.name}`)
            ChainCode.findOne({chainCodeName: chainCode.name}, function (err, chainCodeDoc) {
              if (err) {
                resolve()
              } else {
                if (chainCodeDoc) {
                  allChainCodes.push({
                    name: chainCodeDoc.name
                  })
                }
                resolve()
              }
            })
          })
          promises.push(p)
        }
        Promise.all(promises).then(() => {
          res.json({success: true, allChainCodes})
        })
      }, (err) => {
        res.json({
          success: false,
          error: err.stack ? err.stack : err
        })
      }).catch((err) => {
      res.json({
        success: false,
        error: err.stack ? err.stack : err
      })
    });
  })
})

export default router
