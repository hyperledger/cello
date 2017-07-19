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

ARCH=x86_64
BASEIMAGE_RELEASE=0.3.1
BASE_VERSION=1.0.0
PROJECT_VERSION=1.0.0

IMG_VERSION=1.0.0
# latest is only For testing latest images

echo_b "Downloading images from DockerHub... need a while"

# TODO: we may need some checking on pulling result?
docker pull hyperledger/fabric-baseimage:$ARCH-$BASEIMAGE_RELEASE \
 && docker pull hyperledger/fabric-baseos:$ARCH-$BASEIMAGE_RELEASE \
 && docker pull hyperledger/fabric-peer:$ARCH-$IMG_VERSION \
 && docker pull hyperledger/fabric-orderer:$ARCH-$IMG_VERSION \
 && docker pull hyperledger/fabric-ca:$ARCH-$IMG_VERSION

# Only useful for debugging
# docker pull yeasy/hyperledger-fabric

echo_b "Rename images with official tags ... fabric-peer, fabric-orderer, fabric-tools, fabric-ca, fabric-ccenv, fabric-bareos, fabric-baseimage"
docker tag hyperledger/fabric-peer:$ARCH-$IMG_VERSION hyperledger/fabric-peer \
  && docker tag hyperledger/fabric-peer:$ARCH-$IMG_VERSION hyperledger/fabric-tools \
  && docker tag hyperledger/fabric-orderer:$ARCH-$IMG_VERSION hyperledger/fabric-orderer \
  && docker tag hyperledger/fabric-ca:$ARCH-$IMG_VERSION hyperledger/fabric-ca \
  && docker tag hyperledger/fabric-baseos:$ARCH-$BASEIMAGE_RELEASE hyperledger/fabric-ccenv:$ARCH-$PROJECT_VERSION \
  && docker tag hyperledger/fabric-baseos:$ARCH-$BASEIMAGE_RELEASE hyperledger/fabric-baseos:$ARCH-$BASEIMAGE_RELEASE \
  && docker tag hyperledger/fabric-baseimage:$ARCH-$BASEIMAGE_RELEASE hyperledger/fabric-baseimage:$ARCH-$BASEIMAGE_RELEASE

echo_g "Done, now worker node should have all images, use `docker images` to check"
