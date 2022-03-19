# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
#
# -------------------------------------------------------------
# This makefile defines the following targets, feel free to run "make help" to see help info
#
#   - all (default):  Builds all targets and runs all tests/checks
#   - check:          Setup as master node, and runs all tests/checks, will be triggered by CI
#   - clean:          Cleans the build area
#   - doc|docs:       Start a local web service to explore the documentation
#   - docker[-clean]: Build/clean docker images locally
#   - dockerhub:      Build using dockerhub materials, to verify them
#   - dockerhub-pull: Pulling service images from dockerhub
#   - license:		  Checks sourrce files for Apache license header
#   - help:           Output the help instructions for each command
#   - log:            Check the recent log output of given service
#   - logs:           Check the recent log output of all services
#   - reset:          Clean up and remove local storage (only use for development)
#   - restart:        Stop the cello service and then start
#   - setup-master:   Setup the host as a master node, install pkg and download docker images
#   - setup-worker:   Setup the host as a worker node, install pkg and download docker images
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
-include .makerc/kubernetes
-include .makerc/api-engine
-include .makerc/dashboard
-include .makerc/functions

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
	COMPOSE_FILE=docker-compose-dev.yml
	export DEPLOY_TEMPLATE_NAME=deploy-dev.tmpl
	export DEBUG?=True
endif


all: check

build/docker/common/%/$(DUMMY): ##@Build an common image locally
	$(call build_docker_locally,common,$(BASENAME))

build/docker/agent/%/$(DUMMY): ##@Build an agent image locally
	$(call build_docker_locally,agent,$(AGENT_BASENAME))

build/docker/%/.push: build/docker/%/$(DUMMY)
	@docker login \
		--username=$(DOCKER_HUB_USERNAME) \
		--password=$(DOCKER_HUB_PASSWORD)
	@docker push $(BASENAME)-$(patsubst build/docker/%/.push,%,$@):$(IMG_TAG)

docker-common: $(patsubst %,build/docker/common/%/$(DUMMY),$(COMMON_DOCKER_IMAGES)) ##@Generate docker images locally

agent-docker: $(patsubst %,build/docker/agent/%/$(DUMMY),$(AGENT_DOCKER_IMAGES)) ##@Generate docker images locally

docker: docker-common agent-docker

docker-common-%:
	@$(MAKE) build/docker/common/$*/$(DUMMY)

agent-docker-%:
	@$(MAKE) build/docker/agent/$*/$(DUMMY)

docker-clean: stop image-clean ##@Clean all existing images

DOCKERHUB_COMMON_IMAGES = api-engine dashboard

dockerhub-common: $(patsubst %,dockerhub-common-%,$(DOCKERHUB_COMMON_IMAGES))  ##@Building latest docker images as hosted in dockerhub

dockerhub-common-%: ##@Building latest images with dockerhub materials, to valid them
	$(call build_docker_hub,common,$(BASENAME))

DOCKERHUB_AGENT_IMAGES = ansible kubernetes

dockerhub-agent: $(patsubst %,dockerhub-agent-%,$(DOCKERHUB_AGENT_IMAGES))  ##@Building latest docker images as hosted in dockerhub

dockerhub-agent-%: ##@Building latest images with dockerhub materials, to valid them
	$(call build_docker_hub,agent,$(AGENT_BASENAME))

dockerhub: dockerhub-common dockerhub-agent

dockerhub-pull: ##@Pull service images from dockerhub
	cd scripts/master_node && bash download_images.sh

license:
	scripts/check_license.sh

install: $(patsubst %,build/docker/%/.push,$(COMMON_DOCKER_IMAGES))

check: ##@Code Check code format
	@$(MAKE) license
	find ./docs -type f -name "*.md" -exec egrep -l " +$$" {} \;
	cd src/api-engine && tox && cd ${ROOT_PATH}
	make docker
	MODE=dev make start
	sleep 10
	make test-api
	MODE=dev make stop
	make check-dashboard

test-case: ##@Code Run test case for flask server
	@$(MAKE) -C src/operator-dashboard/test/ all

clean:
	make remove-docker-compose

deep-clean:
	make clean
	make image-clean


# TODO (david_dornseier): As long as there are no release versions, always rewrite
# the entire changelog (bug)
changelog: ##@Update the changelog.md file in the root folder
	#bash scripts/changelog.sh bd0c6db v$(PREV_VERSION)
	bash scripts/changelog.sh v$(PREV_VERSION) HEAD

docs: doc
doc: ##@Create local online documentation and start serve
	command -v mkdocs >/dev/null 2>&1 || pip install mkdocs
	mkdocs serve -f mkdocs.yml

# Use like "make log service=dashboard"
log: ##@Log tail special service log, Use like "make log service=dashboard"
	docker-compose -f bootup/docker-compose-files/${COMPOSE_FILE} logs --tail=200 -f ${service}

logs: ##@Log tail for all service log
	docker-compose -f bootup/docker-compose-files/${COMPOSE_FILE} logs -f --tail=200

image-clean: clean ##@Clean all existing images to rebuild
	echo "Clean all cello related images, may need to remove all containers before"
	docker images | grep "hyperledger/cello-" | awk '{print $3}' | xargs docker rmi -f

start-docker-compose:
	docker-compose -f bootup/docker-compose-files/${COMPOSE_FILE} up -d --force-recreate --remove-orphans

start: ##@Service Start service
	if [ "$(CONFIG_DOCKER_COMPOSE_DEPLOY)" = "y" ]; then \
		make start-docker-compose; \
	else \
		make start-k8s; \
	fi

stop-docker-compose:
	echo "Stop all services with bootup/docker-compose-files/${COMPOSE_FILE}..."
	docker-compose -f bootup/docker-compose-files/${COMPOSE_FILE} stop
	echo "Stop all hyperledger-fabric nodes ..."
	docker ps | grep "hyperledger-fabric" | awk '{print $1}' | xargs docker stop 

remove-docker-compose:
	echo "Remove all services with ${COMPOSE_FILE}..."
	docker-compose -f bootup/docker-compose-files/${COMPOSE_FILE} down -v
	echo "Stop all hyperledger-fabric nodes ..."
	docker ps -a | grep "hyperledger-fabric" | awk '{print $1}' | xargs docker rm -f

start-k8s:
	@$(MAKE) -C bootup/kubernetes init-yaml
	@$(MAKE) -C bootup/kubernetes start

test-api:
	@$(MAKE) -C tests/postman/ test-api

check-dashboard:
	docker-compose -f tests/dashboard/docker-compose.yml up --abort-on-container-exit || (echo "check dashboard failed $$?"; exit 1)

stop-k8s:
	@$(MAKE) -C bootup/kubernetes stop

start-dashboard-dev:
	if [ "$(MOCK)" = "True" ]; then \
		make -C src/dashboard start; \
	else \
		make -C src/dashboard start-no-mock; \
	fi

generate-mock:
	make -C src/dashboard generate-mock

stop: ##@Service Stop service
	if [ "$(CONFIG_DOCKER_COMPOSE_DEPLOY)" = "y" ]; then \
		make stop-docker-compose; \
	else \
		make stop-k8s; \
	fi

reset: clean ##@Environment clean up and remove local storage (only use for development)
	echo "Clean up and remove all local storage..."
	rm -rf ${LOCAL_STORAGE_PATH}/*


restart: stop start ##@Service Restart service

setup-master: ##@Environment Setup dependency for master node
	cd scripts/master_node && bash setup.sh

setup-worker: ##@Environment Setup dependency for worker node
	cd scripts/worker_node && bash setup.sh $(WORKER_TYPE)

menuconfig:
	MENUCONFIG_STYLE=aquatic python kconfig-lib/menuconfig.py

oldconfig:
	python kconfig-lib/oldconfig.py

alldefconfig:
	python kconfig-lib/alldefconfig.py

help: ##@other Show this help.
	@perl -e '$(HELP_FUN)' $(MAKEFILE_LIST)

HELP_FUN = \
	%help; \
	while(<>) { push @{$$help{$$2 // 'options'}}, [$$1, $$3] if /^([a-zA-Z\-]+)\s*:.*\#\#(?:@([a-zA-Z\-]+))?\s(.*)$$/ }; \
	print "usage: make [target]\n\n"; \
	for (sort keys %help) { \
		print "${WHITE}$$_:${RESET}\n"; \
		for (@{$$help{$$_}}) { \
			$$sep = " " x (32 - length $$_->[0]); \
			print "  ${YELLOW}$$_->[0]${RESET}$$sep${GREEN}$$_->[1]${RESET}\n"; \
	}; \
	print "\n"; }

api-engine: # for debug only now
	docker build -t hyperledger/cello-api-engine:latest -f build_image/docker/common/api-engine/Dockerfile.in ./

dashboard:
	docker build -t hyperledger/cello-dashboard:latest -f build_image/docker/common/dashboard/Dockerfile.in ./

docker-rest-agent: # for debug only now
	docker build -t hyperledger/cello-agent-docker:latest -f build_image/docker/agent/docker-rest-agent/Dockerfile.in ./ --build-arg pip=$(PIP)
start-dashboard:
	make -C src/dashboard start;

.PHONY: \
	all \
	check \
	clean \
	deep-clean \
	changelog \
	doc \
	docker \
	dockerhub \
	docker-clean \
	license \
	log \
	logs \
	restart \
	setup-master \
	setup-worker \
	start \
	stop
