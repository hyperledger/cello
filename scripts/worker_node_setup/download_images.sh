#!/usr/bin/env bash


# Detecting whether can import the header file to render colorful cli output
if [ -f ./header.sh ]; then
 source ./header.sh
elif [ -f worker_node_setup/header.sh ]; then
 source worker_node_setup/header.sh
else
 alias echo_r="echo"
 alias echo_g="echo"
 alias echo_b="echo"
fi

ARCH=x86_64
BASEIMAGE_RELEASE=0.3.1
BASE_VERSION=1.0.0
PROJECT_VERSION=1.0.0-preview

IMG_VERSION=0.9.6
# Only For testing latest images
IMG_VERSION=latest

echo_b "Downloading images from DockerHub... need a while"

# TODO: we may need some checking on pulling result?
docker pull yeasy/hyperledger-fabric-base:$IMG_VERSION \
  && docker pull yeasy/hyperledger-fabric-peer:$IMG_VERSION \
  && docker pull yeasy/hyperledger-fabric-orderer:$IMG_VERSION \
  && docker pull yeasy/hyperledger-fabric-ca:$IMG_VERSION

# Only useful for debugging
# docker pull yeasy/hyperledger-fabric

echo_b "Rename images with official tags ... fabric-peer, fabric-orderer, fabric-tools, fabric-ca, fabric-ccenv, fabric-bareos, fabric-baseimage"
docker tag yeasy/hyperledger-fabric-peer:$IMG_VERSION hyperledger/fabric-peer \
  && docker tag yeasy/hyperledger-fabric-peer:$IMG_VERSION hyperledger/fabric-tools \
  && docker tag yeasy/hyperledger-fabric-orderer:$IMG_VERSION hyperledger/fabric-orderer \
  && docker tag yeasy/hyperledger-fabric-ca:$IMG_VERSION hyperledger/fabric-ca \
  && docker tag yeasy/hyperledger-fabric-base:$IMG_VERSION hyperledger/fabric-ccenv:$ARCH-$PROJECT_VERSION \
  && docker tag yeasy/hyperledger-fabric-base:$IMG_VERSION hyperledger/fabric-baseos:$ARCH-$BASE_VERSION \
  && docker tag yeasy/hyperledger-fabric-base:$IMG_VERSION hyperledger/fabric-baseimage:$ARCH-$BASEIMAGE_RELEASE

echo_g "Done, now worker node should have all images, use `docker images` to check"