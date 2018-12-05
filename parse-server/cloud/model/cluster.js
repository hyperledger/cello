/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Parse = require('parse/node');

Parse.Cloud.afterDelete("Cluster", (request) => {
  // remove related service port
  const queryServicePort = new Parse.Query("ServicePort");
  queryServicePort.equalTo("cluster", request.object);
  queryServicePort.find()
    .then(Parse.Object.destroyAll)
    .catch((error) => {
      console.error("Error finding related comments " + error.code + ": " + error.message);
    });
  // remove related container
  const queryContainer = new Parse.Query("Container");
  queryContainer.equalTo("cluster", request.object);
  queryContainer.find()
    .then(Parse.Object.destroyAll)
    .catch((error) => {
      console.error("Error finding related comments " + error.code + ": " + error.message);
    });
});
