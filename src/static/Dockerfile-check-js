
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
FROM node:8.11
MAINTAINER haitao yue "hightall@me.com"
COPY dashboard/package.json /
RUN cd / && npm install --only=dev
CMD bash -c "ln -sf /node_modules /var/www/dashboard/node_modules && cd /var/www/dashboard && npm run build && rm -rf node_modules"
