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

MASTER_NODE ?= "127.0.0.1"

echo_b "Make sure docker and docker-compose are installed"
command -v docker >/dev/null 2>&1 || { echo_r >&2 "No docker-engine found, try installing"; curl -sSL https://get.docker.com/ | sh; sudo dockerd -H tcp://0.0.0.0:2375 -H unix:///var/run/docker.sock --api-cors-header='*' --default-ulimit=nofile=8192:16384 --default-ulimit=nproc=8192:16384 -D & }
command -v docker-compose >/dev/null 2>&1 || { echo_r >&2 "No docker-compose found, try installing"; sudo pip install 'docker-compose>=1.17.0'; }


echo_b "Copy required fabric 1.0, 1.1 and 1.2 artifacts"
ARTIFACTS_DIR=/opt/cello
USER=`whoami`
USERGROUP=`id -gn`
echo_b "Checking local artifacts path ${ARTIFACTS_DIR}..."
[ ! -d ${ARTIFACTS_DIR} ] \
	&& echo_r "Local artifacts path ${ARTIFACTS_DIR} not existed, creating one" \
	&& sudo mkdir -p ${ARTIFACTS_DIR} \
	&& sudo chown -R ${USER}:${USERGROUP} ${ARTIFACTS_DIR}

if [ -z "$MASTER_NODE" ]; then
	echo_r "No master node addr is provided, will ignore nfs setup"
else
	echo_b "Mount NFS Server ${MASTER_NODE}"
	sudo mount -t nfs -o vers=4,loud ${MASTER_NODE}:/ ${ARTIFACTS_DIR}
fi

echo_b "Setup ip forward rules"
sudo sysctl -w net.ipv4.ip_forward=1

echo_g "Setup done"
