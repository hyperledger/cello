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

# TODO: will be removed after we have the user dashboard image
echo_b "Check node:9.2 image."
[ -z "$(docker images -q node:9.2 2> /dev/null)" ] && { echo "pulling node:9.2"; docker pull node:9.2; }

# docker image
ARCH=$(uname -m)
VERSION=latest

for IMG in baseimage mongo nginx ; do
	HC_IMG=hyperledger/cello-${IMG}
	if [ -z "$(docker images -q ${HC_IMG} 2> /dev/null)" ]; then  # not exist
		echo_b "Pulling ${HC_IMG}:${ARCH}-${VERSION} from dockerhub"
		docker pull ${HC_IMG}:${ARCH}-${VERSION}
		docker tag ${HC_IMG}:${ARCH}-${VERSION} ${HC_IMG}
	else
		echo_g "${HC_IMG} already exist locally"
	fi
done

echo_g "All Image downloaded "
