
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
*/
import { Router } from 'express'
import multer from 'multer'
import ChainCode from '../../../models/chainCode'
import ChainModel from '../../../models/chain'
import config from '../../../config'
const mongoose = require('mongoose');
const crypto = require("crypto");
const path = require('path')
const fs = require('fs-extra');
import util from 'util'
const log4js = require('log4js');
const logger = log4js.getLogger(__filename.slice(__dirname.length + 1));
const logLevel = process.env.DEV === "True" ? "DEBUG" : "INFO"
const io = require('../../../io').io();
logger.setLevel(logLevel);

const router = new Router()


router.get("/", function (req, res) {
  ChainCode.find({userId: req.apikey, ...req.query}).sort('-uploadTime').populate('chain').exec( function (err, docs) {
    if (err) res.json({success: false, err})
    const chainCodes = docs.map((chainCode, i) => {
      return {
        id: chainCode.id,
        name: chainCode.name,
        uploadTime: chainCode.uploadTime,
        chainName: chainCode.chain ? chainCode.chain.name : "",
        status: chainCode.status
      }
    })
    res.json({
      success: true,
      chainCodes
    })
  })
})

router.delete("/:id", function (req, res) {
  const chainCodeId = req.params.id;
  ChainCode.findOne({_id: chainCodeId}, function (err, doc) {
    if (err) {
      res.json({success: false})
    } else {
      doc.remove(function(err){logger.error(err)});
      res.json({success: true})
    }
  })
})

router.put("/:id", function (req, res) {
  const name = req.body.name;
  ChainCode.findOneAndUpdate({_id: req.params.id}, {name}, {upsert: true}, function (err, doc) {
    if (err) {
      res.json({success: false})
    } else {
      res.json({success: true})
    }
  })
})

router.post("/install", function (req, res) {
  const chainId = req.body.chainId;
  const id = req.body.id;
  const chainRootDir = util.format(config.path.chain, req.username, chainId)
  const helper = require(`${chainRootDir}/lib/helper`)
  const install = require(`${chainRootDir}/lib/install-chaincode`);

  ChainModel.findOne({_id: chainId}, function (err, chainDoc) {
    if (err) res.json({success: false})
    const clusterId = chainDoc.clusterId;
    const chaincodeVersion = "v0"
    const chaincodePath = `github.com/${id}`
    const chaincodeName = `${clusterId}-${id}`;
    const size = chainDoc.size;
    let peer_end = 1
    let peerNames = []
    let orgNames = ["org1"]
    if (size > 1) {
      orgNames = ["org1", "org2"]
      peer_end = size/2
    }
    for (let i=0; i<peer_end; i++) {
      peerNames.push(`peer${i+1}`)
    }
    helper.initialize(chainDoc.template)
    install.initialize(chainDoc.template)
    function asyncInstallChainCode(arr) {
      return arr.reduce((promise, orgName) => {
        return promise.then((result) => {
          return new Promise((resolve, reject) => {
            helper.setupChaincodeDeploy()
            install.installChaincode(peerNames, chaincodeName, chaincodePath, chaincodeVersion, req.username, orgName)
              .then(function (message) {
                resolve()
              });
          })
        })
      }, Promise.resolve())
    }
    ChainCode.findOne({_id: id}, function (err, chainCode) {
      fs.copySync(chainCode.path, `${chainRootDir}/src/github.com/${id}`)
      asyncInstallChainCode(orgNames).then(() => {
        chainCode.status = "installed";
        chainCode.chainCodeName = chaincodeName;
        chainCode.chain = chainDoc._id;
        chainCode.save()
        res.json({success: true});
      })
    })
  })
})

router.post("/instantiate", function (req, res) {
  const chainId = req.body.chainId;
  const id = req.body.id;
  const user_id = req.apikey;
  const args = req.body.parameter;
  const channelName = config.defaultChannelName;
  const orgName = "org1";
  const chaincodeVersion = "v0"
  const fcn = null
  const chainRootDir = util.format(config.path.chain, req.username, chainId)
  const helper = require(`${chainRootDir}/lib/helper`)
  const instantiate = require(`${chainRootDir}/lib/instantiate-chaincode`);
  ChainCode.findOne({_id: id}).populate('chain').exec(function (err, chainCode) {
    if (err) {
      res.json({success: false})
    } else {
      helper.initialize(chainCode.chain.template)
      helper.setupChaincodeDeploy()
      instantiate.initialize(chainCode.chain.template)
      instantiate.instantiateChaincode(channelName, chainCode.chainCodeName, chaincodeVersion, fcn, args, req.username, orgName)
        .then(function(message) {
          chainCode.status = "instantiated"
          chainCode.save()
          io.to(user_id).emit('instantiate done', {
            chainName: chainCode.chain.name,
            name: chainCode.name,
            id: chainCode.id,
            message: 'instantiate done'
          });
        });
      chainCode.status = "instantiating"
      chainCode.save()
      res.json({
        success: true
      });
    }
  })
})

router.post("/call", function (req, res) {
  const channelName = config.defaultChannelName;
  const method = req.body.method ? req.body.method : "query";
  const orgName = "org1";
  const chainCodeId = req.body.id;
  const args = req.body.parameter;
  const fcn = req.body.func;
  const user_id = req.apikey;
  ChainCode.findOne({_id: chainCodeId}).populate('chain').exec(function (err, chainCode) {
    if (err) {
      res.json({success: false})
    } else {
      const chainId = chainCode.chain.id;
      const chainRootDir = util.format(config.path.chain, req.username, chainId)
      const chainCodeName = chainCode.chainCodeName;
      const helper = require(`${chainRootDir}/lib/helper`)
      helper.initialize(chainCode.chain.template)
      helper.setupChaincodeDeploy()
      const query = require(`${chainRootDir}/lib/query`)
      if (method === "invoke") {
        const invoke = require(`${chainRootDir}/lib/invoke-transaction`)
        invoke.initialize(chainCode.chain.template)
        invoke.invokeChaincode(["peer1"], channelName, chainCodeName, fcn, args, req.username, orgName)
          .then(function(message) {
            const success = message.toLowerCase().indexOf("error") < 0
            res.json({
              message,
              success
            });
            if (success) {
              io.to(user_id).emit('new transaction', {
                id: message
              });
            }
          });
      } else {
        query.initialize(chainCode.chain.template)
        query.queryChaincode("peer1", channelName, chainCodeName, args, fcn, req.username, orgName)
          .then(function(message) {
            const success = message.toLowerCase().indexOf("error") < 0
            res.json({
              success,
              message
            });
          });
      }
    }
  })

})


router.post("/upload", function (req, res) {
  const chainCodeId = crypto.randomBytes(8).toString("hex");
  const codeDir = util.format(config.path.chainCode, req.username, chainCodeId)
  const storage = multer.diskStorage({
    destination: function(req, file, callback) {
      callback(null, codeDir)
    },
    filename: function(req, file, callback) {
      callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
  })
  const upload = multer({
    storage: storage,
    limits: { fileSize: config.fileUploadLimits},
    fileFilter: function(req, file, callback) {
      const ext = path.extname(file.originalname)
      if (ext !== '.go') {
        return callback(res.end({
          success: false,
          message: 'Only go code file is allowed'
        }), null)
      }
      fs.ensureDirSync(codeDir)
      callback(null, true)
    }
  }).single('code');
  upload(req, res, function(err) {
    const newChainCode = new ChainCode({
      name: `SC-${chainCodeId}`,
      userId: req.apikey,
      path: codeDir
    })
    newChainCode.save(function(err, data){
      if(err){ return console.log(err) }
      res.json({
        success: true
      })
    })
  })
})

export default router
