
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
FROM node:9.2
MAINTAINER haitao yue "hightall@me.com"
COPY package.json /
RUN cd / && npm config set registry 'https://registry.npm.taobao.org' && npm install --loglevel http
ENV PATH ${PATH}:/node_modules/.bin
