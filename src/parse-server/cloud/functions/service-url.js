/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Parse = require('parse/node');

const CaConfig = Parse.Object.extend("CaConfig");
const OrgConfig = Parse.Object.extend("OrgConfig");
const PeerConfig = Parse.Object.extend("PeerConfig");
const OrdererConfig = Parse.Object.extend("OrdererConfig");

async function findRegex(regex, value) {
  const matches = [];
  await value.replace(regex, async match => {
    matches.push(match);
  });
  return matches;
}

async function storeUrl(chain, networkConfig, key, value) {
  const number_regex = /[+-]?\d+(\.\d+)?/g;
  let matches = [];
  if (key.startsWith('ca_org')) {
    matches = await findRegex(number_regex, key);
    const caIndex = parseInt(matches[0]);
    const caConfig = new CaConfig();
    await caConfig.save({
      address: value,
      sequence: caIndex,
      networkConfig: networkConfig,
    });
  } else if (key.startsWith('peer')) {
    const peerType = key.split('_').slice(-1)[0];
    matches = await findRegex(number_regex, key);
    const orgIndex = parseInt(matches[1]);
    const peerIndex = parseInt(matches[0]);

    const orgConfigQuery = new Parse.Query("OrgConfig");
    orgConfigQuery.equalTo("networkConfig", networkConfig);
    orgConfigQuery.equalTo("sequence", orgIndex);
    orgConfigQuery.equalTo("name", `peerOrg${orgIndex}`);
    orgConfigQuery.equalTo("mspid", `Org${orgIndex}MSP`);

    let org = await orgConfigQuery.first();
    if (org) {
      org.set("name", `peerOrg${orgIndex}`);
      org.set("mspid", `Org${orgIndex}MSP`);
      await org.save();
    } else {
      org = new OrgConfig();
      await org.save({
        networkConfig: networkConfig,
        sequence: orgIndex,
        name: `peerOrg${orgIndex}`,
        mspid: `Org${orgIndex}MSP`,
      })
    }

    const updateData = {};
    updateData[`${peerType}`] = value;

    const peerConfigQuery = new Parse.Query("PeerConfig");
    peerConfigQuery.equalTo("orgConfig", org);
    peerConfigQuery.equalTo("networkConfig", networkConfig);
    peerConfigQuery.equalTo("sequence", peerIndex);

    let peer = await peerConfigQuery.first();
    if (peer) {
      for (const updateKey in updateData) {
        peer.set(updateKey, updateData[updateKey]);
      }
      await peer.save();
    } else {
      peer = new PeerConfig();
      await peer.save({
        networkConfig: networkConfig,
        sequence: peerIndex,
        orgConfig: org,
        ...updateData,
      })
    }
  } else if (key === 'orderer') {
    const ordererConfig = new OrdererConfig();
    await ordererConfig.save({
      networkConfig: networkConfig,
      serverHostName: 'orderer.example.com',
      url: value,
    });
  }
}

Parse.Cloud.define("storeServiceUrl", async function (request) {
  const { chainId, networkConfigId } = request.params;
  let config = request.params.config || {};
  let result = {
    success: true,
    error: '',
  };

  try {
    const chainQuery = new Parse.Query("Chain");
    const networkConfigQuery = new Parse.Query("NetworkConfig");
    const chain = await chainQuery.get(chainId);
    const networkConfig = await networkConfigQuery.get(networkConfigId);

    for (const key in config) {
      await storeUrl(chain, networkConfig, key, config[key]);
    }
  } catch (e) {
    result.success = false;
    result.error = e.message;
  }

  return result;
});
