#!/bin/bash

# Copyright IBM Corp., All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
# NOT run this in production environment.
# This script will start a mongo-express node for debugging.
# It should be triggered at the upper directory

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

NET=${PROJECT}_default
BIND_ADDR=0.0.0.0
#BIND_ADDR=127.0.0.1

echo "Access port 8081 for the mongo-express UI"

docker run -d \
    --name mongo-express \
    --link mongo:mongo \
    --net ${NET} \
    -p ${BIND_ADDR}:8081:8081 \
    -e ME_CONFIG_BASICAUTH_USERNAME=admin \
    -e ME_CONFIG_BASICAUTH_PASSWORD=pass \
    mongo-express:0.30
