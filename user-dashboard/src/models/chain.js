
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
*/
import jsonfile from 'jsonfile'
import rimraf from 'rimraf'
import sleep from 'sleep-promise';
import config from '../config'
import util from 'util'
const shell = require('shelljs');
const mongoose = require('mongoose');
const fs = require('fs-extra');
const crypto = require("crypto");
const log4js = require('log4js');
const logger = log4js.getLogger(__filename.slice(__dirname.length + 1));
const logLevel = process.env.DEV === "True" ? "DEBUG" : "INFO"
const io = require('../io').io();
import ChainCode from './chainCode'
import UserModel from './user'
logger.setLevel(logLevel);

const chainSchema = new mongoose.Schema({
  user_id: String,
  username: String,
  serviceUrl: mongoose.Schema.Types.Mixed,
  size: Number,
  plugin: String,
  mode: String,
  name: String,
  clusterId: String,
  keyValueStore: String,
  ccSrcPath: String,
  initialized: {type: Boolean, default: false},
  template: mongoose.Schema.Types.Mixed,
  type: String
})

chainSchema.post('save', function(doc, next) {
  const {type, serviceUrl, id, size, username} = doc;
  const templateFile = `/usr/app/src/src/config-template/${type}/${size}peers/config.json`
  let org_numbers = [1]
  let peer_end = 1
  if (size > 1) {
    org_numbers = [1, 2]
    peer_end = size/2
  }
  const chainRootDir = util.format(config.path.chain, username, id)
  fs.ensureDirSync(chainRootDir);
  try {
    jsonfile.readFile(templateFile, function(err, template) {
      template.network.orderer.url = `grpcs://${serviceUrl.orderer}`
      org_numbers.map((org_number, i) => {
        const ca_org_ecap = serviceUrl[`ca_org${org_number}_ecap`]
        template.network[`org${org_number}`].ca = `https://${ca_org_ecap}`
        for (let i=0; i<peer_end; i++) {
          template.network[`org${org_number}`].peers[`peer${i+1}`].requests = "grpcs://"+serviceUrl[`peer${i}_org${org_number}_grpc`]
          template.network[`org${org_number}`].peers[`peer${i+1}`].events = "grpcs://"+serviceUrl[`peer${i}_org${org_number}_event`]
        }
      })
      template.keyValueStore = `${chainRootDir}/client-kvs`
      template.CC_SRC_PATH = chainRootDir
      const txDir = `${chainRootDir}/tx`
      const libDir = `${chainRootDir}/lib`
      fs.ensureDirSync(libDir)
      shell.cp('-R', '/usr/app/src/src/config-template/cc_code/src', template.CC_SRC_PATH);
      shell.cp('-R', `/usr/app/src/src/modules/${type}/*`, libDir)

      fs.ensureDirSync(template.keyValueStore)
      fs.ensureDirSync(txDir)

      const configFile = `${chainRootDir}/network-config.json`
      jsonfile.writeFile(configFile, template, function (err) {
        if (err) logger.error(err)
        doc._template = template;
        model.findOneAndUpdate({_id: doc.id}, {template}, {upsert: true}, function (err, doc) {
          if (err) { logger.error(err) }
          next()
        })
      })
    })
  } catch (err) {
    logger.error(err)
  }
});

function copyExamples (doc, type) {
  const {username, user_id} = doc;
  const fsCommon = require('fs')
  const path = require('path')

  const dirs = p => fsCommon.readdirSync(p).filter(f => fsCommon.statSync(path.join(p, f)).isDirectory())
  const subDirs = dirs(config.examples[type])
  subDirs.map((subDir, i) => {
    const exampleSourceDir = path.join(config.examples[type], subDir)
    const chainCodeId = crypto.randomBytes(8).toString("hex");
    const codeDir = util.format(config.path.chainCode, username, chainCodeId)
    fs.ensureDirSync(codeDir)
    shell.cp('-R', `${exampleSourceDir}/*`, codeDir);
    const newChainCode = new ChainCode({
      name: `${type}-${subDir}`,
      userId: user_id,
      path: codeDir
    })
    newChainCode.save(function(err, data){
      if(err){ return console.log(err) }
    })
  })
}

function initialFabric (doc) {
  const {id, username, clusterId, user_id, size, keyValueStore, template} = doc;
  const channelName = config.defaultChannelName;
  const chainRootDir = util.format(config.path.chain, username, id)
  const channelConfigPath = `${chainRootDir}/tx`
  let orgNames = ["org1"]
  let peer_end = 1
  let peerNames = []
  if (size > 1) {
    orgNames = ["org1", "org2"]
    peer_end = size/2
  }
  for (let i=0; i<peer_end; i++) {
    peerNames.push(`peer${i+1}`)
  }

  if (shell.exec(`configtxgen -profile TwoOrgsChannel -channelID ${channelName} -outputCreateChannelTx ${channelConfigPath}/${channelName}.tx`).code !== 0) {
    return
  }
  const helper = require(`${chainRootDir}/lib/helper.js`)
  helper.initialize(doc._template)
  const channels = require(`${chainRootDir}/lib/create-channel.js`);
  channels.initialize(doc._template)
  function asyncInstallChainCode(arr) {
    return arr.reduce((promise, orgName) => {
      return promise.then((result) => {
        return new Promise((resolve, reject) => {
          const join = require(`${chainRootDir}/lib/join-channel.js`);
          join.initialize(doc._template)
          join.joinChannel(channelName, peerNames, username, orgName)
            .then(function(message) {
              resolve()
            });
        })
      })
    }, Promise.resolve())
  }
  channels.createChannel(channelName, `${channelConfigPath}/${channelName}.tx`, username, "org1")
    .then(function(message) {
      sleep(100).then(function () {
        helper.setupCryptoSuite(channelName)
      }).then(sleep(1000)).then(function () {
        asyncInstallChainCode(orgNames).then(() => {
          io.to(user_id).emit('update chain', {message: 'initialize done'});
          model.findOneAndUpdate({_id: doc.id}, {initialized: true}, {upsert: true}, function (err, doc) {
            if (err) { logger.error(err) }
          })
        })
      })
    })
}

chainSchema.post('save', function (doc, next) {
  const {type, initialized, user_id} = doc;
  if (type === "fabric" && !initialized) {
    initialFabric(doc)
  }
  UserModel.findOne({userId: user_id}, function (err, user) {
    if (user.exampleCodes.indexOf(type) < 0) {
      user.exampleCodes.push(type)
      user.save()
      copyExamples(doc, type)
    }
  })
  next()
})

chainSchema.post('remove', function(doc) {
  const {username, id} = doc;
  const chainRootDir = util.format(config.path.chain, username, id)
  rimraf(chainRootDir, function () { logger.info(`delete directory ${chainRootDir}`); });
  ChainCode.find({chain: doc}).exec( function (err, chainCodes) {
    chainCodes.map((chainCode, i) => {
      chainCode.status = "uploaded";
      chainCode.save()
    })
  })
});

const model = mongoose.model('chain', chainSchema);

module.exports = model;
