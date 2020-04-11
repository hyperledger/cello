/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  require('./app/lib/fabric/v1_4')(app);
  require('./app/lib/fabric')(app);
  require('./app/lib/fabric-ca/ca_v1_4')(app);
  require('./app/lib/fabric-ca')(app);
};
