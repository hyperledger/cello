#!/bin/bash

NGINX_RAW_CONFIG=/etc/nginx/conf.d/default.conf.tmpl
NGINX_CONFIG=/etc/nginx/conf.d/default.conf
envsubst '$$API_PROXY,$$SERVICE_PORT' < ${NGINX_RAW_CONFIG} > ${NGINX_CONFIG}
