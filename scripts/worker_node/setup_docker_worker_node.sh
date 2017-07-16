#!/usr/bin/env bash

# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

#  This script will help setup Docker at a server, then the server can be used as a worker node.

# Detecting whether can import the header file to render colorful cli output
if [ -f ../header.sh ]; then
 source ../header.sh
elif [ -f scripts/header.sh ]; then
 source scripts/header.sh
else
 alias echo_r="echo"
 alias echo_g="echo"
 alias echo_b="echo"
fi

# pull fabric images
ARCH=x86_64
BASEIMAGE_RELEASE=0.3.1
BASE_VERSION=1.0.0
PROJECT_VERSION=1.0.0
IMG_TAG=1.0.0

echo_b "===Pulling fabric images... with tag = ${IMG_TAG}"
docker pull hyperledger/fabric-peer:$ARCH-$IMG_TAG
docker pull hyperledger/fabric-orderer:$ARCH-$IMG_TAG
docker pull hyperledger/fabric-ca:$ARCH-$IMG_TAG
docker pull hyperledger/fabric-ccenv:$ARCH-$IMG_TAG
docker pull hyperledger/fabric-baseimage:$ARCH-$BASEIMAGE_RELEASE
docker pull hyperledger/fabric-baseos:$ARCH-$BASEIMAGE_RELEASE

echo_b "===Re-tagging images to *latest* tag"
docker tag hyperledger/fabric-peer:$ARCH-$IMG_TAG hyperledger/fabric-peer
docker tag hyperledger/fabric-peer:$ARCH-$IMG_TAG hyperledger/fabric-tools
docker tag hyperledger/fabric-orderer:$ARCH-$IMG_TAG hyperledger/fabric-orderer
docker tag hyperledger/fabric-ca:$ARCH-$IMG_TAG hyperledger/fabric-ca

echo_b "Copy required fabric 1.0 artifacts"
ARTIFACTS_DIR=/opt/cello
USER=`whoami`
echo_b "Checking local artifacts path ${ARTIFACTS_DIR}..."
[ ! -d ${ARTIFACTS_DIR} ] \
	&& echo_r "Local artifacts path ${ARTIFACTS_DIR} not existed, creating one" \
	&& sudo mkdir -p ${ARTIFACTS_DIR} \
	&& cp -r src/agent/docker/_compose_files/fabric-1.0 ${ARTIFACTS_DIR} \
	&& sudo chown -R ${USER}:${USER} ${ARTIFACTS_DIR}

echo_b "Setup ip forward rules"
sudo sysctl -w net.ipv4.ip_forward=1

echo_g "Setup done"