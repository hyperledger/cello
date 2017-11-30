
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
FROM hyperledger/cello-baseimage
MAINTAINER li xu cheng "lixucheng@aliyun.com"
RUN npm install -g requirejs
RUN mkdir -p /usr/app/src
COPY . /usr/app/src
WORKDIR /usr/app/src
RUN mv /usr/app/src/js /reactjs && \
	cd /reactjs && npm install && npm run build && rm -rf node_modules && \
	cd /reactjs/home && npm install && npm run build && rm -rf node_modules && \
	cd /usr/app/src && npm install && npm run build && npm cache clean --force
EXPOSE 8080
CMD ["npm", "start"]
