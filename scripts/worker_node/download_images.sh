#!/usr/bin/env bash
#
# Copyright O Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# Detecting whether can import the header file to render colorful cli output
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

# pull fabric images
ARCH=`uname -m | sed 's|i686|x86|' | sed 's|x64|x86_64|'`
BASEIMAGE_RELEASE=0.3.2
BASE_VERSION=1.0.5
PROJECT_VERSION=1.0.5
IMG_TAG=1.0.5
HLF_VERSION=1.0.5  # TODO: should be the same with src/common/utils.py

echo_b "Downloading fabric images from DockerHub...with tag = ${IMG_TAG}... need a while"
# TODO: we may need some checking on pulling result?
for IMG in peer tools orderer ca ccenv; do
	HLF_IMG=hyperledger/fabric-${IMG}:$ARCH-$IMG_TAG
	if [ -z "$(docker images -q ${HLF_IMG} 2> /dev/null)" ]; then  # not exist
		docker pull ${HLF_IMG}
	else
		echo_g "${HLF_IMG} already exist locally"
	fi
done

HLF_IMG=hyperledger/fabric-baseimage:$ARCH-$BASEIMAGE_RELEASE
[ -z "$(docker images -q ${HLF_IMG} 2> /dev/null)" ] && docker pull ${HLF_IMG}
HLF_IMG=hyperledger/fabric-baseos:$ARCH-$BASEIMAGE_RELEASE
[ -z "$(docker images -q ${HLF_IMG} 2> /dev/null)" ] && docker pull ${HLF_IMG}

# Only useful for debugging
# docker pull yeasy/hyperledger-fabric

echo_b "===Re-tagging fabric images to *:${HLF_VERSION}* tag"
for IMG in peer tools orderer ca; do
	HLF_IMG=hyperledger/fabric-${IMG}
	docker tag ${HLF_IMG}:$ARCH-$IMG_TAG ${HLF_IMG}:${HLF_VERSION}
done

echo_b "Downloading images for fabric explorer"
for IMG in mysql:5.7 yeasy/blockchain-explorer:0.1.0-preview; do
	if [ -z "$(docker images -q ${IMG} 2> /dev/null)" ]; then  # not exist
		docker pull ${IMG}
	else
		echo_g "${IMG} already exist locally"
	fi
done

 # TODO: fix this if there's official images
IMG_TAG=1.0.4
echo_b "Downloading and retag images for kafka/zookeeper separately, as they are still v1.0.4"
for IMG in kafka zookeeper; do
	HLF_IMG=hyperledger/fabric-${IMG}
	if [ -z "$(docker images -q ${HLF_IMG}:${HLF_VERSION} 2> /dev/null)" ]; then  # not exist
		docker pull ${HLF_IMG}:$ARCH-$IMG_TAG
		docker tag ${HLF_IMG}:$ARCH-$IMG_TAG ${HLF_IMG}:${HLF_VERSION}
	else
		echo_g "${HLF_IMG}:$ARCH-$IMG_TAG already exist locally"
	fi
done
echo_g "Done, now worker node should have all required images, use 'docker images' to check"
