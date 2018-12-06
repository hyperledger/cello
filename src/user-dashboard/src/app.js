/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

module.exports = app => {
  require('./app/lib/fabric/v1_0')(app);
  require('./app/lib/fabric/v1_2')(app);
  require('./app/lib/fabric')(app);
  if (app.config.parse) require('./app/lib/parse')(app);
};
