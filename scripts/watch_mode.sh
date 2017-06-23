#!/usr/bin/env bash

# Copyright IBM Corp., All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# This script will (re)start all services.
# It should be triggered at the upper directory, and safe to repeat.

source scripts/header.sh

echo_b "Run watch mode for react js files..."
docker-compose -f docker-compose-watch-mode.yml up --no-recreate

#echo "Restarting mongo_express"
#[[ "$(docker ps -q --filter='name=mongo_express')" != "" ]] && docker restart mongo_express