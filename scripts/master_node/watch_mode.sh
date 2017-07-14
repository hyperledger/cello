#!/usr/bin/env bash

# Copyright IBM Corp., All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# This script will (re)start all services.
# It should be triggered at the upper directory, and safe to repeat.

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


echo_b "Run watch mode for react js files..."
docker-compose -f docker-compose-watch-mode.yml up --no-recreate

#echo "Restarting mongo_express"
#[[ "$(docker ps -q --filter='name=mongo_express')" != "" ]] && docker restart mongo_express