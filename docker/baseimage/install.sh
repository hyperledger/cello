#!/bin/bash
set -x
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
# Based thie file on https://github.com/docker-library/mongo/blob/master/3.4/Dockerfile &
# https://docs.mongodb.com/manual/tutorial/install-mongodb-enterprise-on-ubuntu/#install-mongodb-enterprise

set -x \
	&& apt-get update && apt-get install -y supervisor gettext-base && rm -rf /var/lib/apt/lists/*
