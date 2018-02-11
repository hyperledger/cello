# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
FROM node:9.2 as build_login
MAINTAINER haitao yue "hightall@me.com"
RUN cd /tmp && git clone https://github.com/hyperledger/cello.git
RUN cp -r /tmp/cello/user-dashboard/js /app
RUN mkdir -p /usr/app
RUN cp -r /tmp/cello/user-dashboard /usr/app/src
RUN cd /app && npm install --loglevel http && npm run build

FROM node:9.2 as build_home
MAINTAINER haitao yue "hightall@me.com"
RUN cd /tmp && git clone https://github.com/hyperledger/cello.git
RUN cp -r /tmp/cello/user-dashboard/js /app
RUN mkdir -p /usr/app
RUN cp -r /tmp/cello/user-dashboard /usr/app/src
RUN cd /app/home && npm install --loglevel http && npm run build

FROM node:9.2 as build_dashboard
MAINTAINER haitao yue "hightall@me.com"
RUN cd /tmp && git clone https://github.com/hyperledger/cello.git
RUN cp -r /tmp/cello/user-dashboard/js /app
RUN mkdir -p /usr/app
RUN cp -r /tmp/cello/user-dashboard /usr/app/src
RUN cd /app/dashboard && npm install --loglevel http && npm run build

FROM node:9.2
MAINTAINER haitao yue "hightall@me.com"
RUN npm install -g requirejs
RUN cd /tmp && git clone https://github.com/hyperledger/cello.git
COPY package.json /
RUN cd / && yarn install -g --verbose
ENV PATH ${PATH}:/node_modules/.bin
RUN mkdir -p /usr/app
RUN cp -r /tmp/cello/user-dashboard /usr/app/src
WORKDIR /usr/app/src
ENV FABRIC_VERSION 1.0.5
RUN cd /tmp && ARCH=$(echo "$(uname -s|tr '[:upper:]' '[:lower:]'|sed 's/mingw64_nt.*/windows/')-$(uname -m | sed 's/x86_64/amd64/g')" | awk '{print tolower($0)}') && echo $ARCH &&wget -c https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/${ARCH}-${FABRIC_VERSION}/hyperledger-fabric-${ARCH}-${FABRIC_VERSION}.tar.gz && tar -zxvf hyperledger-fabric-${ARCH}-${FABRIC_VERSION}.tar.gz && mv bin/configtxgen /usr/local/bin/configtxgen
RUN mkdir -p /etc/hyperledger
RUN cp -r /tmp/cello/user-dashboard/fabric/fabric /etc/hyperledger/fabric
COPY --from=build_login /usr/app/src/src/public/js/dist /usr/app/src/src/public/js/dist
COPY --from=build_home /usr/app/src/src/public/js/dist /usr/app/src/src/public/js/dist
COPY --from=build_dashboard /usr/app/src/src/public/js/dist /usr/app/src/src/public/js/dist
ENV FABRIC_CFG_PATH /etc/hyperledger/fabric
EXPOSE 8080
CMD ["npm", "start"]
