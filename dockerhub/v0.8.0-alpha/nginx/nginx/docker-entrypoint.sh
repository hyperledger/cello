#!/bin/bash
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
# Based this file on https://github.com/yeasy/docker-nginx/blob/master/docker-entrypoint.sh

set -e
backend="${BACKEND:-localhost}"
port="${PORT:-80}"
username="${USERNAME:-user}"
password="${PASSWORD:-pass}"

htpasswd -c -b /etc/nginx/.htpasswd "$username" "$password"

sed "s/BACKEND/$backend/; s/PORT/$port/" /etc/nginx/nginx.default.conf > /etc/nginx/nginx.conf

nginx -c /etc/nginx/nginx.conf
