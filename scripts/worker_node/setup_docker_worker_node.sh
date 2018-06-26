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
bash ./download_images.sh

echo_b "Copy required fabric 1.0 and 1.1 artifacts"
ARTIFACTS_DIR=/opt/cello
USER=`whoami`
USERGROUP=`id -gn`
echo_b "Checking local artifacts path ${ARTIFACTS_DIR}..."
[ ! -d ${ARTIFACTS_DIR} ] \
	&& echo_r "Local artifacts path ${ARTIFACTS_DIR} not existed, creating one" \
	&& sudo mkdir -p ${ARTIFACTS_DIR} \
	&& sudo chown -R ${USER}:${USERGROUP} ${ARTIFACTS_DIR}

echo_b "Mount NFS Server ${MASTER_NODE_IP}"
sudo mount -t nfs -o vers=4,loud ${MASTER_NODE_IP}:/ ${ARTIFACTS_DIR}

echo_b "Setup ip forward rules"
sudo sysctl -w net.ipv4.ip_forward=1

echo_g "Setup done"
