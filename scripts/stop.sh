#!/usr/bin/env bash

# This script will (re)start all services.
# It should be triggered at the upper directory, and safe to repeat.

source scripts/header.sh

echo_b "Stop all services..."
docker-compose stop

echo_b "Remove all services..."
docker-compose rm -f -a
