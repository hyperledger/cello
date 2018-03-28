#!/bin/bash
set -x
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
# Based thie file on https://github.com/docker-library/mongo/blob/master/3.4/Dockerfile &
# https://docs.mongodb.com/manual/tutorial/install-mongodb-enterprise-on-ubuntu/#install-mongodb-enterprise

# ----------------------------------------------------------------
# Install mongo
# ----------------------------------------------------------------

groupadd -r mongodb && useradd -r -g mongodb mongodb

apt-get update \
&& apt-get install -y --no-install-recommends ca-certificates jq numactl sudo\
&& rm -rf /var/lib/apt/lists/*

# grab gosu for easy step-down from root
export GOSU_VERSION=1.10

set -x \
	&& apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/* \
	&& wget -O /usr/local/bin/gosu "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$(dpkg --print-architecture)" \
	&& wget -O /usr/local/bin/gosu.asc "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$(dpkg --print-architecture).asc" \
	&& export GNUPGHOME="$(mktemp -d)" \
	&& gpg --keyserver ha.pool.sks-keyservers.net --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4 \
	&& gpg --batch --verify /usr/local/bin/gosu.asc /usr/local/bin/gosu \
	&& rm -r "$GNUPGHOME" /usr/local/bin/gosu.asc \
	&& chmod +x /usr/local/bin/gosu \
	&& gosu nobody true

mkdir /docker-entrypoint-initdb.d

# Add GPG Keys & update apt sources

apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6

echo "deb [ arch=amd64,arm64,ppc64el,s390x ] http://repo.mongodb.com/apt/ubuntu xenial/mongodb-enterprise/3.4 multiverse" | tee /etc/apt/sources.list.d/mongodb-enterprise.list

apt-get update

export MONGO_PACKAGE=mongodb-enterprise
# export MONGO_REPO=repo.mongodb.com
# export MONGO_PACKAGE=${MONGO_PACKAGE} MONGO_REPO=${MONGO_REPO}

export MONGO_MAJOR=3.4
export MONGO_VERSION=3.4.10

apt-get install -y \
		${MONGO_PACKAGE}=$MONGO_VERSION \
		${MONGO_PACKAGE}-server=$MONGO_VERSION \
		${MONGO_PACKAGE}-shell=$MONGO_VERSION \
		${MONGO_PACKAGE}-mongos=$MONGO_VERSION \
		${MONGO_PACKAGE}-tools=$MONGO_VERSION

mkdir -p /data/db /data/configdb \
&& chown -R mongodb:mongodb /data/db /data/configdb

# ----------------------------------------------------------------
# Install NodeJS
# ----------------------------------------------------------------
NODE_VER=8.9.0

ARCH=`uname -m | sed 's|i686|x86|' | sed 's|x86_64|x64|'`
NODE_PKG=node-v$NODE_VER-linux-$ARCH.tar.gz
SRC_PATH=/tmp/$NODE_PKG

# First remove any prior packages downloaded in case of failure
cd /tmp
rm -f node*.tar.gz
wget --quiet https://nodejs.org/dist/v$NODE_VER/$NODE_PKG
cd /usr/local && sudo tar --strip-components 1 -xzf $SRC_PATH
rm -f /tmp/node*.tar.gz

# ----------------------------------------------------------------
# Install python3 and pip
# ----------------------------------------------------------------
if [[ $ARCH = 'ppc64le' ]];then
apt-get install build-essential libssl-dev libffi-dev python3-dev libxslt-dev python3 -y
else
apt-get install python3 git -y
fi

update-alternatives --install /usr/bin/python python /usr/bin/python3 10
cd /tmp
wget https://bootstrap.pypa.io/get-pip.py
python get-pip.py
rm get-pip.py

# ----------------------------------------------------------------
# Install nginx
# ----------------------------------------------------------------
groupadd -r nginx && useradd -r -g nginx nginx
apt-get install nginx apache2-utils -y
