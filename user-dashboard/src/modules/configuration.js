
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/2.
 */
module.exports = {
    cookieName: "BlockChainAccount",
    SV_BaseURL: process.env.SV_BaseURL || "https://ptopenlab.com/cloudlab/api/",
    RESTful_Server: process.env.RESTful_Server || "9.186.91.4:8108",
    RESTful_BaseURL: process.env.RESTful_BaseURL || "/restful/api/v2/",
    PoolManager_Server: process.env.PoolManager_Server || "9.186.91.26",
    PoolManager_BaseURL: "/v2/",
    Log_Server: process.env.Log_Server || "9.186.91.29:8080",
    Log_BaseURL: "/v1/log",
    mongodb: {
        ip: "dashboard_mongo",
        port: 27017,
        name: "bc_dashboard",
        auth: false,
        username: "admin",
        password: "passw0rd"
    },
    topology: {
        vp0: [200, 130],
        vp1: [300, -130],
        vp2: [-300, -130],
        vp3: [-200, 130],
        vp4: [350, 30],
        vp5: [-350, 30],
        vp6: [50, -250],
        vp7: [-50, -250]
    }
};