# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
FROM node:8.9
MAINTAINER haitao yue "hightall@me.com"
RUN cd /tmp && git clone https://github.com/hyperledger/cello.git
RUN cd /tmp/cello/user-dashboard/src && cp package.json yarn.lock / && cd / && yarn install -g --verbose
ENV PATH ${PATH}:/node_modules/.bin
RUN mv /tmp/cello/user-dashboard/src /var/www
RUN cd /var/www && ln -sf /node_modules . && npm run build
WORKDIR /var/www
EXPOSE 8081

ENV FABRIC_VERSION 1.0.5
RUN cd /tmp && ARCH=$(echo "$(uname -s|tr '[:upper:]' '[:lower:]'|sed 's/mingw64_nt.*/windows/')-$(uname -m | sed 's/x86_64/amd64/g')" | awk '{print tolower($0)}') && echo $ARCH &&wget -c https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/${ARCH}-${FABRIC_VERSION}/hyperledger-fabric-${ARCH}-${FABRIC_VERSION}.tar.gz && tar -zxvf hyperledger-fabric-${ARCH}-${FABRIC_VERSION}.tar.gz && mv bin/configtxgen /usr/local/bin/configtxgen
RUN mkdir -p /etc/hyperledger
RUN mv /tmp/cello/user-dashboard/fabric/fabric /etc/hyperledger/fabric
ENV FABRIC_CFG_PATH /etc/hyperledger/fabric
ENV MONGO_PORT 27017

CMD ln -sf /node_modules . && npm run start
