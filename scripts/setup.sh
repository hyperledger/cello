#!/usr/bin/env bash
# This script will try setup a valid environment for the docker-compose running.
# It should be triggered at the upper directory, and safe to repeat.

source scripts/header.sh

USER=`whoami`

DB_DIR=/opt/${PROJECT}/mongo

sudo apt-get update && sudo apt-get install -y -m curl docker-engine python-pip

sudo pip install --upgrade pip

sudo pip install --upgrade tox

echo_b "Checking Docker-engine..."
command -v docker >/dev/null 2>&1 || { echo_r >&2 "No docker-engine found, try installing"; curl -sSL https://get.docker.com/ | sh; sudo service docker restart; }

echo_b "Add existing user to docker group"
sudo usermod -aG docker ${USER}

echo_b "Checking Docker-compose..."
command -v docker-compose >/dev/null 2>&1 || { echo_r >&2 "No docker-compose found, try installing"; sudo pip install -i http://pypi.douban.com/simple/ --trusted-host pypi.douban.com docker-compose; }

echo_b "Checking local mounted database path..."
[ ! -d ${DB_DIR} ] && echo_r "Local database path ${DB_DIR} not existed, creating one" && sudo mkdir -p ${DB_DIR} && sudo chown -R ${USER}:${USER} ${DB_DIR}

echo_b "Checking local Docker image..."
pull_image "mongo:3.2"
pull_image "python:3.5"
pull_image "yeasy/nginx:latest"

[ `sudo docker ps -qa|wc -l` -gt 0 ] && echo_r "Warn: existing containers may cause unpredictable failure, suggest to clean them using docker rm"

echo_g "Setup done, please logout and login again."
echo_g "It's safe to run this script repeatedly. Just re-run if it fails."
