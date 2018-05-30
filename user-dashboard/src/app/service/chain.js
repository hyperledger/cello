/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Service = require('egg').Service;
const qs = require('qs');

class ChainService extends Service {
  async list() {
    const { ctx, config } = this;
    const listUrl = config.operator.url.cluster.list;
    let chains = [];
    const response = await ctx.curl(`${listUrl}?${qs.stringify({
      user_id: ctx.user.id,
    })}`, {
      method: 'GET',
      timeout: 30000,
      contentType: 'json',
      dataType: 'json',
    });
    if (response.status === 200) {
      const ids = response.data.data.map(chain => { return chain.id; });
      chains = await ctx.model.Chain.find({ chainId: { $in: ids } });
    }

    return {
      data: chains,
    };
  }
  async cleanDB(chainId) {
    const { ctx } = this;
    const chain = await ctx.model.Chain.findOne({ chainId });
    const networkConfig = await ctx.model.NetworkConfig.findOne({ chain: chain._id.toString() });
    const networkConfigId = networkConfig._id.toString();
    const orderers = await ctx.model.OrdererConfig.find({ networkConfig: networkConfigId });
    orderers.map(ordererItem => {
      return ordererItem.remove();
    });
    const orgs = await ctx.model.OrgConfig.find({ networkConfig: networkConfigId });
    orgs.map(orgItem => {
      return orgItem.remove();
    });
    const peers = await ctx.model.PeerConfig.find({ networkConfig: networkConfigId });
    peers.map(peerItem => {
      return peerItem.remove();
    });
    const cas = await ctx.model.CaConfig.find({ networkConfig: networkConfigId });
    cas.map(caItem => {
      return caItem.remove();
    });
    networkConfig.remove();
    chain.remove();
  }
  async release() {
    const { ctx, config } = this;
    const operateUrl = config.operator.url.cluster.operate;
    const clusterId = ctx.params.id;
    const response = await ctx.curl(operateUrl, {
      method: 'POST',
      data: {
        action: 'release',
        user_id: ctx.user.id,
        cluster_id: clusterId,
      },
      timeout: 60000,
    });
    if (response.status === 200) {
      await this.cleanDB(clusterId);
    }
  }
  async findRegex(regex, value) {
    const matches = [];
    await value.replace(regex, async match => {
      matches.push(match);
    });
    return matches;
  }
  async handle_url(chainId, networkConfigId, key, value) {
    const { ctx } = this;
    const number_regex = /[+-]?\d+(\.\d+)?/g;
    let matches = [];
    if (key.startsWith('ca_org')) {
      matches = await this.findRegex(number_regex, key);
      const caIndex = parseInt(matches[0]);
      await ctx.model.CaConfig.create({
        address: value,
        sequence: caIndex,
        networkConfig: networkConfigId,
      });
    } else if (key.startsWith('peer')) {
      const peerType = key.split('_').slice(-1)[0];
      matches = await this.findRegex(number_regex, key);
      const orgIndex = parseInt(matches[1]);
      const peerIndex = parseInt(matches[0]);
      const org = await ctx.model.OrgConfig.findOneAndUpdate({
        networkConfig: networkConfigId,
        sequence: orgIndex,
        name: `peerOrg${orgIndex}`,
        mspid: `Org${orgIndex}MSP`,
      }, { name: `peerOrg${orgIndex}`, mspid: `Org${orgIndex}MSP` }, { upsert: true, new: true });
      const updateData = {};
      updateData[`${peerType}`] = value;
      await ctx.model.PeerConfig.findOneAndUpdate({
        orgConfig: org._id.toString(),
        networkConfig: networkConfigId,
        sequence: peerIndex,
      }, updateData, { upsert: true, new: true });
    } else if (key === 'orderer') {
      await ctx.model.OrdererConfig.create({
        networkConfig: networkConfigId,
        url: value,
      });
    }
  }
  async apply() {
    const { ctx, config } = this;
    const operateUrl = config.operator.url.cluster.operate;
    const { type, size, name } = ctx.request.body;
    const response = await ctx.curl(operateUrl, {
      method: 'POST',
      data: {
        action: 'apply',
        user_id: ctx.user.id,
        size,
        type,
      },
    });
    if (response.status === 200) {
      const data = JSON.parse(response.data.toString());
      const { service_url } = data.data;
      const chain = await ctx.model.Chain.create({
        chainId: data.data.id,
        user: ctx.user.id,
        serviceUrl: service_url,
        size,
        type,
        name,
      });
      const networkConfig = await ctx.model.NetworkConfig.create({
        user: ctx.user.id,
        chain: chain._id.toString(),
      });
      for (const key in service_url) {
        await this.handle_url(chain._id.toString(), networkConfig._id.toString(), key, service_url[key]);
      }
    }
    return response.status === 200;
  }
}

module.exports = ChainService;
