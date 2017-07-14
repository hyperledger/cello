#!/usr/bin/env bash

# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

#  This script will help setup a Kubernetes cluster at servers, then the cluster can be used as a worker node.

# Detecting whether can import the header file to render colorful cli output
if [ -f ../header.sh ]; then
 source ../header.sh
elif [ -f scripts/header.sh ]; then
 source scripts/header.sh
else
 alias echo_r="echo"
 alias echo_g="echo"
 alias echo_b="echo"
fi

ARCH=x86_64
# TODO:
