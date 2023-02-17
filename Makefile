# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
#
# -------------------------------------------------------------
# This makefile defines the following targets, feel free to run "make help" to see help info
#
#   - clean:          Cleans the build area
#   - dockerhub-pull: Pulling service images from dockerhub
#   - reset:          Clean up and remove local storage (only use for development)
#   - start:          Start the cello service
#   - stop:           Stop the cello service, and remove all service containers

GREEN  := $(shell tput -Txterm setaf 2)
WHITE  := $(shell tput -Txterm setaf 7)
YELLOW := $(shell tput -Txterm setaf 3)
RESET  := $(shell tput -Txterm sgr0)
ARCH   := $(shell uname -m)

#Set the source of PIP in docker agent image
PIP=pip.conf.bak

# changelog specific version tags
PREV_VERSION?=0.9.0

# Building image usage
DOCKER_NS ?= hyperledger
BASENAME ?= $(DOCKER_NS)/cello
AGENT_BASENAME ?= $(DOCKER_NS)/cello-agent
VERSION ?= 0.9.0
IS_RELEASE=false

DOCKER_BASE_x86_64=python:3.6
DOCKER_BASE_ppc64le=ppc64le/python:3.6
DOCKER_BASE_s390x=s390x/python:3.6
DOCKER_BASE_arm64=python:3.6
DOCKER_BASE=$(DOCKER_BASE_$(ARCH))
BASE_VERSION ?= $(ARCH)-$(VERSION)

ifeq ($(IS_RELEASE),false)
	EXTRA_VERSION ?= snapshot-$(shell git rev-parse --short HEAD)
	IMG_TAG=$(BASE_VERSION)-$(EXTRA_VERSION)
else
	IMG_TAG=$(BASE_VERSION)
endif

# The Cello service listen interface, please use the public available IP.
SERVER_PUBLIC_IP ?= 127.0.0.1

LOCAL_STORAGE_PATH=/opt/cello

# Docker images needed to run cello services
COMMON_DOCKER_IMAGES = api-engine nginx dashboard
AGENT_DOCKER_IMAGES = ansible kubernetes
DUMMY = .$(IMG_TAG)

ifeq ($(DOCKER_BASE), )
	$(error "Architecture \"$(ARCH)\" is unsupported")
endif

# Frontend needed
SLASH:=/
REPLACE_SLASH:=\/

# deploy method docker-compose/k8s
export DEPLOY_METHOD?=docker-compose
export CONFIG_DOCKER_COMPOSE_DEPLOY=y

-include .config
-include .makerc/api-engine
-include .makerc/dashboard

.EXPORT_ALL_VARIABLES:

export ROOT_PATH = ${PWD}
ROOT_PATH_REPLACE=$(subst $(SLASH),$(REPLACE_SLASH),$(ROOT_PATH))

# macOS has diff `sed` usage from Linux
SYSTEM=$(shell uname)
ifeq ($(SYSTEM), Darwin)
	SED = sed -ix
else
	SED = sed -i
endif

# Specify what type the worker node is setup as
WORKER_TYPE ?= docker

# Specify the running mode, prod or dev
MODE ?= prod
ifeq ($(CONFIG_PROD_MODE),y)
	COMPOSE_FILE=docker-compose.yml
	export DEPLOY_TEMPLATE_NAME=deploy.tmpl
	export DEBUG?=False
else
	COMPOSE_FILE=docker-compose.dev.yml
	export DEPLOY_TEMPLATE_NAME=deploy-dev.tmpl
	export DEBUG?=True
endif

docker-clean: stop image-clean ##@Clean all existing images

license:
	scripts/check_license.sh

clean:
	make remove-docker-compose

deep-clean:
	make clean
	make remove-hyperledger-fabric-containers
	make image-clean
	rm -rf $(LOCAL_STORAGE_PATH)

image-clean: clean ##@Clean all existing images to rebuild
	echo "Clean all cello related images, may need to remove all containers before"
	docker images | grep "cello-" | awk '{print $3}' | xargs docker rmi -f

start-docker-compose:
	docker compose -f bootup/docker-compose-files/${COMPOSE_FILE} up -d --force-recreate --remove-orphans

start: ##@Service Start service
	make start-docker-compose
	
stop-docker-compose:
	echo "Stop all services with bootup/docker-compose-files/${COMPOSE_FILE}..."
	docker compose -f bootup/docker-compose-files/${COMPOSE_FILE} stop
	echo "Stop all services successfully"

remove-docker-compose:
	make stop-docker-compose
	echo "Remove all services with bootup/docker-compose-files/${COMPOSE_FILE}..."
	if docker ps -a | grep "cello-"; then \
		docker ps -a | grep "cello-" | awk '{print $1}' | xargs docker rm -f >/dev/null 2>&1; \
		rm -rf /opt/cello; \
	fi
	echo "Remove all services successfully"

remove-hyperledger-fabric-containers:
	echo "Remove all nodes ..."
	if docker ps -a | grep "hyperledger-fabric"; then \
		docker ps -a | grep "hyperledger-fabric" | awk '{print $1}' | xargs docker rm -f >/dev/null 2>&1; \
		rm -rf /opt/hyperledger; \
	fi
	echo "Remove all nodes successfully"

stop: ##@Service Stop service
	if [ "$(CONFIG_DOCKER_COMPOSE_DEPLOY)" = "y" ]; then \
		make stop-docker-compose; \
	else \
		make stop-k8s; \
	fi

restart: stop start ##@Service Restart service

api-engine: # for debug only now
	docker build -t hyperledger/cello-api-engine:latest -f build_image/docker/common/api-engine/Dockerfile.in ./ --platform linux/$(ARCH); \
	
docker-rest-agent: # for debug only now
	docker build -t hyperledger/cello-agent-docker:latest -f build_image/docker/agent/docker-rest-agent/Dockerfile.in ./ --build-arg pip=$(PIP) --platform linux/$(ARCH); \

fabric:
	docker image pull yeasy/hyperledger-fabric:2.2.0

dashboard: # for debug only now
	docker build -t hyperledger/cello-dashboard:latest -f build_image/docker/common/dashboard/Dockerfile.in ./

docker-compose: api-engine fabric docker-rest-agent dashboard

local: docker-compose start-docker-compose 


.PHONY: \
	deep-clean \
	docker-clean \
	license \
	stop-docker-compose \
	remove-docker-compose \
	remove-hyperledger-fabric-containers \
	restart \
	start \
	api-engine \
	fabric \
	docker-rest-agent \
	dashboard \
	docker-compose \
	local \
