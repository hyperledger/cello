
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
*/
import { Router } from 'express'
const Chain = require("../../../modules/chain");
import ChainModel from '../../../models/chain'
import config from '../../../config'

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

router.get("/:apikey/db-list", function (req, res) {
  ChainModel.find({user_id: req.apikey}, function (err, docs) {
    if (err) res.json({success: false, err})
    const chains = docs.map((chain, i) => {
      return {
        id: chain.id,
        name: chain.name
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

export default router
