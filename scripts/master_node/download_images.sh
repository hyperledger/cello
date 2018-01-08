#!/usr/bin/env bash

# Copyright IBM Corp., All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# Detecting whether can import the header file to render colorful cli output
# Need add choice option
if [ -f ../header.sh ]; then
	source ../header.sh
elif [ -f scripts/header.sh ]; then
	source scripts/header.sh
else
	echo_r() {
		echo "$@"
	}
	echo_g() {
		echo "$@"
	}
	echo_b() {
		echo "$@"
	}
fi

echo_b "Downloading the docker images for master node"


ARCH=$(uname -m)

docker pull node:9.2 \
	&& docker pull hyperledger/cello-baseimage:${ARCH}-latest \
	&& docker pull hyperledger/cello-mongo:${ARCH}-latest \
	&& docker pull hyperledger/cello-nginx:${ARCH}-latest \
	&& docker tag hyperledger/cello-baseimage:${ARCH}-latest hyperledger/cello-baseimage \
	&& docker tag hyperledger/cello-mongo:${ARCH}-latest hyperledger/cello-mongo \
	&& docker tag hyperledger/cello-nginx:${ARCH}-latest hyperledger/cello-nginx
