/*
 SPDX-License-Identifier: Apache-2.0
*/
import { stringify } from "qs";
import request from "../utils/request";
import config from "../utils/config";

export async function queryDeploys(params) {
  return request(`${config.url.deploy.list}?${stringify(params)}`);
}

export async function queryDeploy(id) {
  return request(`${config.url.deploy.query.format({ id })}`);
}

export async function operateDeploy(params) {
  return request(config.url.deploy.operate.format({ id: params.id }), {
    method: "POST",
    body: params,
  });
}
