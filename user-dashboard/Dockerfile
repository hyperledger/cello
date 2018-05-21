
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
FROM node:8.9
MAINTAINER haitao yue "hightall@me.com"
COPY src/package.json /
RUN cd / && yarn install -g
ENV PATH ${PATH}:/node_modules/.bin
COPY src /var/www
WORKDIR /var/www
EXPOSE 7001

ENV FABRIC_VERSION 1.0.5
RUN cd /tmp && ARCH=$(echo "$(uname -s|tr '[:upper:]' '[:lower:]'|sed 's/mingw64_nt.*/windows/')-$(uname -m | sed 's/x86_64/amd64/g')" | awk '{print tolower($0)}') && echo $ARCH &&wget -c https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/${ARCH}-${FABRIC_VERSION}/hyperledger-fabric-${ARCH}-${FABRIC_VERSION}.tar.gz && tar -zxvf hyperledger-fabric-${ARCH}-${FABRIC_VERSION}.tar.gz && mv bin/configtxgen /usr/local/bin/configtxgen
COPY fabric/fabric /etc/hyperledger/fabric
ENV FABRIC_CFG_PATH /etc/hyperledger/fabric

CMD ["npm", "start"]
