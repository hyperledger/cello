
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/19.
 */
({
    appDir: "./",
    baseUrl: "./public/js",
    mainConfigFile: "./public/js/common.js",
    dir: "../built",
    fileExclusionRegExp: /^node_modules|.idea|build\.js|\.DS_Store|Dockerfile|docker-compose\.yml/,
    skipDirOptimize: true,
    preserveLicenseComments: false,
    modules:[
        {
            name: "common",
            include: [
                "jquery",
                "uikit",
                "lodash",
                "plugin/notify",
                "plugin/tooltip"
            ]
        },
        {
            name: "app/index",
            exclude: ["common"]
        },
        {
            name: "app/dashboard/home",
            exclude: ["common"]
        },
        {
            name: "app/dashboard/chain/list",
            exclude: ["common"]
        },
        {
            name: "app/dashboard/chain/detail",
            exclude: ["common"]
        },
        {
            name: "app/dashboard/contract/list",
            exclude: ["common"]
        },
        {
            name: "app/dashboard/analytics/nochains",
            exclude: ["common"]
        },
        {
            name: "app/dashboard/analytics/overview",
            exclude: ["common"]
        },
        {
            name: "app/dashboard/analytics/chaincode/list",
            exclude: ["common"]
        },
        {
            name: "app/dashboard/analytics/fabric",
            exclude: ["common"]
        },
        {
            name: "app/dashboard/analytics/infrastructure",
            exclude: ["common"]
        },
        {
            name: "app/dashboard/store",
            exclude: ["common"]
        }
    ]
})