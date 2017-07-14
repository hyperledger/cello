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
 alias echo_r="echo"
 alias echo_g="echo"
 alias echo_b="echo"
fi

echo_b "This script will setup the docker images for master node"
echo_b "Pull python:3.5, mongo:3.2, mongo-express:0.30(optional for debugging) and yeasy/nginx"

docker pull python:3.5 \
	&& docker pull mongo:3.2 \
	&& docker pull mongo-express:0.30 \
	&& docker pull yeasy/nginx:latest
