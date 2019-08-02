#!/usr/bin/env bash

NGINX_RAW_CONFIG=/etc/nginx/nginx.conf.default
NGINX_CONFIG=/etc/nginx/nginx.conf
envsubst '$$URL_PREFIX,$$UWSGI_SERVER_HOST' < ${NGINX_RAW_CONFIG} > ${NGINX_CONFIG}