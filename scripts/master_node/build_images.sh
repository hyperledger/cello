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
VERSION="latest"
PIP=pip.conf.bak

echo_b "Building the docker images for Cello services: VERSION=${VERSION} ARCH=${ARCH}"

# docker image

for IMG in dashboard api-engine; do
	HLC_IMG=hyperledger/cello-${IMG}
	PATH=build_image/docker/common/${IMG}/Dockerfile.in
	if [ -z "$(docker images -q ${HLC_IMG}:latest 2> /dev/null)" ]; then  # not exist
	echo_b "Build ${HLC_IMG} locally"
	docker build -t ${HLC_IMG}:latest -f ${PATH} ./ --build-arg pip=${PIP} --platform linux/${ARCH}
	else
		echo_g "${HLC_IMG} already exist locally"
	fi
done

echo_g "All Image built "
