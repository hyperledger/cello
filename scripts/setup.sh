#!/usr/bin/env bash

# Copyright IBM Corp., All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
# This script will try setup a valid environment for the docker-compose running.
# It should be triggered at the upper directory, and safe to repeat.

source scripts/header.sh
# collect ID from /etc/os-release as distribution name
# tested on debian,ubuntu,mint , centos,fedora  ,opensuse
function get_distribution {
distribution="Unknown"
while read -r line
do
 element=$(echo $line | cut -f1 -d=)
 if [ "$element" = "ID" ]
 then
     distribution=$(echo $line | cut -f2 -d=)
 fi
done < "/etc/os-release"
echo "${distribution//\"}"
}

USER=`whoami`
DISTRO=$(get_distribution)
DB_DIR=/opt/${PROJECT}/mongo

case $DISTRO in
  ubuntu)
      sudo apt-get update && sudo apt-get install -y curl docker-engine python-pip
     ;;
  linuxmint)
     sudo apt-get install apt-transport-https ca-certificates -y
     sudo apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
     sudo echo deb https://apt.dockerproject.org/repo ubuntu-xenial main >> /etc/apt/sources.list.d/docker.list
     sudo apt-get update
     sudo apt-get purge lxc-docker
     sudo apt-get install python-pip
     sudo apt-get install linux-image-extra-$(uname -r) -y
     sudo apt-get install docker-engine cgroup-lite apparmor -y
     sudo service docker start
     ;;
  debian)
     sudo apt-get install apt-transport-https ca-certificates -y
     sudo sh -c "echo deb https://apt.dockerproject.org/repo debian-jessie main > /etc/apt/sources.list.d/docker.list"
     sudo apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
     sudo apt-get update
     sudo apt-cache policy docker-engine
     sudo apt-get install docker-engine curl python-pip  -y
     sudo service docker start
     ;;
  centos)
     sudo yum install -y epel-release yum-utils
     sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
     sudo yum makecache fast
     sudo yum update && sudo yum install -y docker-ce python-pip
     sudo systemctl enable docker
     sudo systemctl start docker
     ;;
  fedora)
     sudo dnf -y update
     sudo dnf -y install  docker python-pip --allowerasing
     sudo systemctl enable docker
     sudo systemctl start docker
     ;;
  opensuse)
     sudo zypper refresh
     sudo zypper install docker docker-compose python-pip
     sudo systemctl restart docker
     ;;
  *)
     echo "Linux distribution not identified !!! skipping docker & pip installation"
     ;;
esac
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
