/*
 SPDX-License-Identifier: Apache-2.0
*/
import request from "../utils/request";
import config from "../utils/config";

export async function querySmartContracts() {
  return request(config.url.smartContract.list);
}

export async function deleteSmartContractCode(id) {
  return request(config.url.smartContract.codeOperate.format({ id }), {
    method: "DELETE",
  });
}

export async function updateSmartContractCode(payload) {
  return request(
    config.url.smartContract.codeOperate.format({ id: payload.id }),
    {
      method: "PUT",
      body: payload,
    }
  );
}

export async function deleteSmartContract(id) {
  return request(config.url.smartContract.operate.format({ id }), {
    method: "DELETE",
  });
}

export async function querySmartContract(id) {
  return request(config.url.smartContract.operate.format({ id }));
}

export async function deploySmartContract(payload) {
  return request(
    config.url.smartContract.codeDeploy.format({ id: payload.id }),
    {
      method: "POST",
      body: payload,
    }
  );
}
