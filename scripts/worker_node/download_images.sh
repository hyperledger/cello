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
ARCH_1_0=`uname -m | sed 's|i686|x86|' | sed 's|x64|x86_64|'`
BASEIMAGE_RELEASE_1_0=0.3.2
BASE_VERSION_1_0=1.0.5
PROJECT_VERSION_1_0=1.0.5
IMG_TAG_1_0=1.0.5
HLF_VERSION_1_0=1.0.5

ARCH_1_1=$ARCH_1_0
BASEIMAGE_RELEASE_1_1=0.4.6
BASE_VERSION_1_1=1.1.0
PROJECT_VERSION_1_1=1.1.0
IMG_TAG_1_1=1.1.0
HLF_VERSION_1_1=1.1.0

ARCH_1_2=$ARCH_1_0
BASEIMAGE_RELEASE_1_2=0.4.10
BASE_VERSION_1_2=1.2.0
PROJECT_VERSION_1_2=1.2.0
IMG_TAG_1_2=1.2.0
HLF_VERSION_1_2=1.2.0  # TODO: should be the same with src/common/utils.py

if [ $ARCH_1_2 = "x86_64" ];then
ARCH_1_2="amd64"
fi

function downloadImages() {
    ARCH=$1
    IMG_TAG=$2
    BASEIMAGE_RELEASE=$3
    HLF_VERSION=$4

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

    IMG_TAG=$5
    echo_b "Downloading and retag images for kafka/zookeeper separately, as their img_tag format is different"
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
}

downloadImages $ARCH_1_0 $IMG_TAG_1_0 $BASEIMAGE_RELEASE_1_0 $HLF_VERSION_1_0 $IMG_TAG_1_0            #kafka and zookeeper have the same IMG_TAG as peer in 1.0
downloadImages $ARCH_1_1 $IMG_TAG_1_1 $BASEIMAGE_RELEASE_1_1 $HLF_VERSION_1_1 $BASEIMAGE_RELEASE_1_1  #kafka and zookeeper have the same IMG_TAG as baseimage in 1.1
downloadImages $ARCH_1_2 $IMG_TAG_1_2 $BASEIMAGE_RELEASE_1_2 $HLF_VERSION_1_2 $BASEIMAGE_RELEASE_1_2  #kafka and zookeeper have the same IMG_TAG as baseimage in 1.2
