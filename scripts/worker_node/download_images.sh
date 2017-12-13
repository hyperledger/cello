#!/usr/bin/env bash


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
ARCH=`uname -m | sed 's|i686|x86|' | sed 's|x86_64|x64|'`
BASEIMAGE_RELEASE=0.3.2
BASE_VERSION=1.0.5
PROJECT_VERSION=1.0.5
IMG_TAG=1.0.5

echo_b "Downloading fabric images from DockerHub...with tag = ${IMG_TAG}... need a while"
# TODO: we may need some checking on pulling result?
docker pull hyperledger/fabric-peer:$ARCH-$IMG_TAG
docker pull hyperledger/fabric-tools:$ARCH-$IMG_TAG
docker pull hyperledger/fabric-orderer:$ARCH-$IMG_TAG
docker pull hyperledger/fabric-ca:$ARCH-$IMG_TAG
docker pull hyperledger/fabric-ccenv:$ARCH-$IMG_TAG
docker pull hyperledger/fabric-baseimage:$ARCH-$BASEIMAGE_RELEASE
docker pull hyperledger/fabric-baseos:$ARCH-$BASEIMAGE_RELEASE

# Only useful for debugging
# docker pull yeasy/hyperledger-fabric

echo_b "===Re-tagging images to *latest* tag"
docker tag hyperledger/fabric-peer:$ARCH-$IMG_TAG hyperledger/fabric-peer
docker tag hyperledger/fabric-tools:$ARCH-$IMG_TAG hyperledger/fabric-tools
docker tag hyperledger/fabric-orderer:$ARCH-$IMG_TAG hyperledger/fabric-orderer
docker tag hyperledger/fabric-ca:$ARCH-$IMG_TAG hyperledger/fabric-ca

echo_g "Done, now worker node should have all images, use `docker images` to check"
