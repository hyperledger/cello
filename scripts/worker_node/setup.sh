#!/usr/bin/env bash

# Copyright IBM Corp., All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
# This script will try setup a valid environment for the docker-compose running.
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


# TODO: detect env to choose which script to run

bash setup_docker_worker_node.sh