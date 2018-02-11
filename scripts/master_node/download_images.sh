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

ARCH=$(uname -m)
VERSION="${VERSION:-latest}"

echo_b "Downloading the docker images for Cello services: VERSION=${VERSION} ARCH=${ARCH}"

# TODO: will be removed after we have the user dashboard image
echo_b "Check node:9.2 image."
[ -z "$(docker images -q node:9.2 2> /dev/null)" ] && { echo "pulling node:9.2"; docker pull node:9.2; }

# docker image

for IMG in baseimage engine mongo nginx operator-dashboard user-dashboard watchdog ; do
	HLC_IMG=hyperledger/cello-${IMG}
	if [ -z "$(docker images -q ${HLC_IMG}:${ARCH}-${VERSION} 2> /dev/null)" ]; then  # not exist
		echo_b "Pulling ${HLC_IMG}:${ARCH}-${VERSION} from dockerhub"
		docker pull ${HLC_IMG}:${ARCH}-${VERSION}
		docker tag ${HLC_IMG}:${ARCH}-${VERSION} ${HLC_IMG}  # match the docker-compose file
	else
		echo_g "${HLC_IMG} already exist locally"
	fi
done

echo_g "All Image downloaded "
