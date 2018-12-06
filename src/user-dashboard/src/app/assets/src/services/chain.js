/*
 SPDX-License-Identifier: Apache-2.0
*/
import { stringify } from "qs";
import request from "../utils/request";
import config from "../utils/config";

export async function queryChains() {
  return request(config.url.chain.list);
}

export async function release(id) {
  return request(`${config.url.chain.release.format({ id })}`, {
    method: "DELETE",
  });
}

export async function apply(params) {
  return request(config.url.chain.apply, {
    method: "POST",
    body: params,
  });
}

export async function queryChain(params) {
  return request(
    `${config.url.chain.query.format({ id: params.id })}?${stringify(params)}`
  );
}
