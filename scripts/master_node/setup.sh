#!/usr/bin/env bash

# Copyright IBM Corp., All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
# This script will try setup as Cello  master node.
# It should be triggered by the `make setup-master`, and safe to repeat.
# 1) Install docker stuffs;
# 2) Download Cello images from Dockerhub;
# 3) Create local storage path to be mounted to Workers.
# ./setup.sh

# Detecting whether can import the header file to render colorful cli output
# Need add choice option
if [ -f ../header.sh ]; then
	source ../header.sh
elif [ -f scripts/header.sh ]; then
	source scripts/header.sh
else
	echo_r() {
		echo "$@"
	}
	echo_g() {
		echo "$@"
	}
	echo_b() {
		echo "$@"
	}
fi


# collect ID from /etc/os-release as distribution name
# tested on debian, ubuntu, mint, centos, fedora, opensuse
get_distribution() {
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

echo_b "user: ${USER}, distro: ${DISTRO}, db_dir: ${DB_DIR}"
echo_b "It is recommended to use Ubuntu 18.04 OS."

# Install necessary software including curl, python-pip, tox, docker
install_software() {
	if [ $# -eq 0 ]; then
		echo "Should pass me the software name to install"
	fi
	install_list=$1
	echo "Install software: $install_list"
	case $DISTRO in
		ubuntu)
			command -v curl >/dev/null 2>&1 || { echo_r >&2 "No curl found, try installing";sudo apt-get install -y curl; }
			command -v pip >/dev/null 2>&1 || { echo_r >&2 "No pip found, try installing";sudo apt-get install -y python-pip; }
			command -v docker >/dev/null 2>&1 || { echo_r >&2 "No docker-engine found, try installing"; curl -sSL https://get.docker.com/ | sh; sudo service docker restart; }
			command -v docker-compose >/dev/null 2>&1 || { echo_r >&2 "No docker-compose found, try installing"; sudo pip install 'docker-compose>=1.17.0'; }
			sudo apt-get install -y tox nfs-common;
			;;
		linuxmint)
			sudo apt-get install apt-transport-https ca-certificates -y
			sudo apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
			sudo echo deb https://apt.dockerproject.org/repo ubuntu-xenial main >> /etc/apt/sources.list.d/docker.list
			sudo apt-get update
			sudo apt-get install python-pip
			sudo apt-get install linux-image-extra-$(uname -r) -y
			command -v docker >/dev/null 2>&1 || { sudo apt-get purge lxc-docker; sudo apt-get install docker-engine cgroup-lite apparmor -y; sudo service docker start; }
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
	echo_b "Add existing user ${USER} to docker group"
	sudo usermod -aG docker ${USER}
}

echo_b "Make sure have installed: python-pip, tox, curl and docker-engine"
install_list=()
for software in pip tox curl docker docker-compose; do
	command -v ${software} >/dev/null 2>&1 || { install_list+=($software); break; }
done
[ -z "$install_list" ] || install_software $install_list

echo_b "Checking if existing containers"
if [ `sudo docker ps -qa|wc -l` -gt 0 ]; then
	echo_r "Warn: existing containers may cause unpredictable failure, suggest to clean them using docker rm"
	docker ps -a
fi

echo_b "Download required Docker images for Cello Services..."
bash ./download_images.sh

echo_b "Checking local storage path ${DB_DIR}, which will be mounted to Workers later..."
[ ! -d ${DB_DIR} ] \
	&& echo_r "Local database path ${DB_DIR} not existed, creating one" \
	&& sudo mkdir -p ${DB_DIR} \
	&& sudo chown -R ${USER}:${USER} ${DB_DIR}

echo_g "Setup done, please logout and login again."
echo_g "It's safe to run this script repeatedly."
