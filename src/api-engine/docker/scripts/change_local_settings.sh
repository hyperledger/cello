#!/usr/bin/env bash
LOCAL_SETTINGS="/var/www/server/api_engine/settings.py"
RAW_LOCAL_SETTINGS="/var/www/server/api_engine/settings.py.example"

envsubst < ${RAW_LOCAL_SETTINGS} > ${LOCAL_SETTINGS}