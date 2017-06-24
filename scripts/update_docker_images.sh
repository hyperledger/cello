#!/usr/bin/env bash

# Copyright IBM Corp., All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

echo "This script will setup the docker images for master node"
echo "Pull python:3.5, mongo:3.2, mongo-express:0.30 and yeasy/nginx"

docker pull python:3.5 \
	&& docker pull mongo:3.2 \
	&& docker pull mongo-express:0.30 \
	&& docker pull yeasy/nginx:latest
