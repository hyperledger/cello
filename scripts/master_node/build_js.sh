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


echo_b "Start build js files..."
docker-compose -f bootup/docker-compose-files/docker-compose-build-js.yaml up --force-recreate

#echo "Restarting mongo_express"
#[[ "$(docker ps -q --filter='name=mongo_express')" != "" ]] && docker restart mongo_express