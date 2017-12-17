
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
FROM node:9.2
MAINTAINER haitao yue "hightall@me.com"
RUN npm install -g requirejs
COPY package.json /
RUN cd / && yarn install -g --verbose
RUN yarn add nodemon -g
ENV PATH ${PATH}:/node_modules/.bin
RUN mkdir -p /usr/app/src
#COPY . /usr/app/src
WORKDIR /usr/app/src
ENV FABRIC_VERSION 1.0.5
RUN cd /tmp && wget -c https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/linux-amd64-${FABRIC_VERSION}/hyperledger-fabric-linux-amd64-${FABRIC_VERSION}.tar.gz \
	&& tar -zxvf hyperledger-fabric-linux-amd64-${FABRIC_VERSION}.tar.gz && mv bin/configtxgen /usr/local/bin/configtxgen
COPY fabric/fabric /etc/hyperledger/fabric
ENV FABRIC_CFG_PATH /etc/hyperledger/fabric
#RUN mv /usr/app/src/js /reactjs && \
#	cd /reactjs && npm install && npm run build && rm -rf node_modules && \
#	cd /reactjs/home && npm install && npm run build && rm -rf node_modules && \
#	cd /usr/app/src && npm install && npm run build && npm cache clean --force
EXPOSE 8080
CMD ["npm", "start"]
