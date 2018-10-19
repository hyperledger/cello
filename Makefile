# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
#
# -------------------------------------------------------------
# This makefile defines the following targets
#
#   - all (default):  Builds all targets and runs all tests/checks
#   - check:          Setup as master node, and runs all tests/checks, will be triggered by CI
#   - clean:          Cleans the build area
#   - doc:            Start a local web service to explore the documentation
#   - docker[-clean]: Build/clean docker images locally
#   - dockerhub:      Build using dockerhub materials, to verify them
#   - dockerhub-pull: Pulling service images from dockerhub
#   - license:		    Checks sourrce files for Apache license header
#   - help:           Output the help instructions for each command
#   - log:            Check the recent log output of given service
#   - logs:           Check the recent log output of all services
#   - restart:        Stop the cello service and then start
#   - setup-master:   Setup the host as a master node, install pkg and download docker images
#   - setup-worker:   Setup the host as a worker node, install pkg and download docker images
#   - start:          Start the cello service
#   - stop:           Stop the cello service, and remove all service containers
#   - start-nfs:      Start the cello nfs service
#   - stop-nfs:       Stop the cello nfs service

GREEN  := $(shell tput -Txterm setaf 2)
WHITE  := $(shell tput -Txterm setaf 7)
YELLOW := $(shell tput -Txterm setaf 3)
RESET  := $(shell tput -Txterm sgr0)
ARCH   := $(shell uname -m)

# changelog specific version tags
PREV_VERSION?=0.9.0-beta

# Building image usage
DOCKER_NS ?= hyperledger
BASENAME ?= $(DOCKER_NS)/cello
VERSION ?= 0.9.0-beta
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

# Docker images needed to run cello services
DOCKER_IMAGES = baseimage mongo engine operator-dashboard ansible-agent watchdog user-dashboard
DUMMY = .$(IMG_TAG)

ifeq ($(DOCKER_BASE), )
	$(error "Architecture \"$(ARCH)\" is unsupported")
endif

# Frontend needed
SLASH:=/
REPLACE_SLASH:=\/

-include .makerc/service
-include .makerc/email
-include .makerc/operator-dashboard
-include .makerc/user-dashboard
-include .makerc/worker-node
-include .makerc/keycloak

export ROOT_PATH = ${PWD}
ROOT_PATH_REPLACE=$(subst $(SLASH),$(REPLACE_SLASH),$(ROOT_PATH))

# macOS has diff `sed` usage from Linux
SYSTEM=$(shell uname)
ifeq ($(SYSTEM), Darwin)
	SED = sed -ix
else
	SED = sed -i
endif

ifneq ($(wildcard /opt/cello/keycloak-mysql),)
	INITIAL_CMD =
	INITIAL_KEYCLOAK=false
else
	INITIAL_CMD = make initial-keycloak
	INITIAL_KEYCLOAK=true
endif

# Specify what type the worker node is setup as
WORKER_TYPE ?= docker

# Specify the running mode, prod or dev
MODE ?= prod
ifeq ($(MODE),prod)
	COMPOSE_FILE=docker-compose-files/docker-compose.yml
else
	COMPOSE_FILE=docker-compose-files/docker-compose-dev.yml
endif


all: check

build/docker/baseimage/$(DUMMY): build/docker/baseimage/$(DUMMY)
build/docker/nginx/$(DUMMY): build/docker/nginx/$(DUMMY)
build/docker/mongo/$(DUMMY): build/docker/mongo/$(DUMMY)
build/docker/engine/$(DUMMY): build/docker/engine/$(DUMMY)
build/docker/operator-dashboard/$(DUMMY): build/docker/operator-dashboard/$(DUMMY)
build/docker/ansible-agent/$(DUMMY): build/docker/ansible-agent/$(DUMMY)
build/docker/watchdog/$(DUMMY): build/docker/watchdog/$(DUMMY)
build/docker/user-dashboard/$(DUMMY): build/docker/user-dashboard/$(DUMMY)

build/docker/%/$(DUMMY): ##@Build an image locally
	$(eval TARGET = ${patsubst build/docker/%/$(DUMMY),%,${@}})
	$(eval IMG_NAME = $(BASENAME)-$(TARGET))
	@mkdir -p $(@D)
	@echo "Building docker $(TARGET)"
	@cat docker/$(TARGET)/Dockerfile.in \
		| sed -e 's|_DOCKER_BASE_|$(DOCKER_BASE)|g' \
		| sed -e 's|_NS_|$(DOCKER_NS)|g' \
		| sed -e 's|_TAG_|$(IMG_TAG)|g' \
		> $(@D)/Dockerfile
	docker build -f $(@D)/Dockerfile \
		-t $(IMG_NAME) \
		-t $(IMG_NAME):$(IMG_TAG) \
		. ;
	@touch $@ ;

build/docker/%/.push: build/docker/%/$(DUMMY)
	@docker login \
		--username=$(DOCKER_HUB_USERNAME) \
		--password=$(DOCKER_HUB_PASSWORD)
	@docker push $(BASENAME)-$(patsubst build/docker/%/.push,%,$@):$(IMG_TAG)

docker: $(patsubst %,build/docker/%/$(DUMMY),$(DOCKER_IMAGES)) ##@Generate docker images locally

docker-operator-dashboard: build/docker/operator-dashboard/$(DUMMY)

docker-clean: stop image-clean ##@Clean all existing images

DOCKERHUB_IMAGES = baseimage engine operator-dashboard user-dashboard watchdog ansible-agent

dockerhub: $(patsubst %,dockerhub-%,$(DOCKERHUB_IMAGES))  ##@Building latest images with dockerhub materials, to valid them

dockerhub-%: ##@Building latest images with dockerhub materials, to valid them
	dir=$*; \
	IMG=hyperledger/cello-$$dir; \
	echo "Building $$IMG"; \
	docker build \
	-t $$IMG \
	-t $$IMG:x86_64-latest \
	dockerhub/latest/$$dir

dockerhub-pull: ##@Pull service images from dockerhub
	cd scripts/master_node && bash download_images.sh

license:
	bash scripts/check_license.sh

install: $(patsubst %,build/docker/%/.push,$(DOCKER_IMAGES))

check-js: ##@Code Check check js code format
	docker-compose -f docker-compose-files/docker-compose-check-js.yaml up

check: setup-master docker-operator-dashboard ##@Code Check code format
	@$(MAKE) license
	find ./docs -type f -name "*.md" -exec egrep -l " +$$" {} \;
	tox
	@$(MAKE) check-js
	@$(MAKE) test-case
	MODE=dev make start && sleep 60 && MODE=dev make stop

test-case: ##@Code Run test case for flask server
	@$(MAKE) -C test/ all

clean: ##@Code Clean tox result
	rm -rf .tox .cache *.egg-info build/
	find . -name "*.pyc" -o -name "__pycache__" | xargs rm -rf

# TODO (david_dornseier): As long as there are no release versions, always rewrite
# the entire changelog (bug)
changelog: ##@Update the changelog.md file in the root folder
	#bash scripts/changelog.sh bd0c6db v$(PREV_VERSION)
	bash scripts/changelog.sh v$(PREV_VERSION) HEAD

doc: ##@Create local online documentation and start serve
	pip install mkdocs
	mkdocs serve

# Use like "make log service=dashboard"
log: ##@Log tail special service log, Use like "make log service=dashboard"
	docker-compose -f ${COMPOSE_FILE} logs --tail=200 -f ${service}

logs: ##@Log tail for all service log
	docker-compose -f ${COMPOSE_FILE} logs -f --tail=200

image-clean: clean ##@Clean all existing images to rebuild
	echo "Clean all cello related images, may need to remove all containers before"
	docker images | grep "hyperledger/cello-" | awk '{print $3}' | xargs docker rmi -f

initial-env: ##@Configuration Initial Configuration for dashboard
	@envsubst < env.tmpl > .env

initial-keycloak:
	docker-compose -f docker-compose-files/docker-compose-initial.yml up --abort-on-container-exit

start: ##@Service Start service
	make initial-env
	echo "Start all services with ${COMPOSE_FILE}... docker images must exist local now, otherwise, run 'make setup-master first' !"
	if [ "$(MODE)" = "dev" ]; then \
		make build-admin-js; \
	fi
	$(INITIAL_CMD)
	if [ "$(INITIAL_KEYCLOAK)" = "true" ]; then \
		OPERATOR_DASHBOARD_SSO_SECRET=`sed -n '/export OPERATOR_DASHBOARD_SSO_SECRET?=/ {s///p;q;}' .makerc/operator-dashboard` \
		USER_DASHBOARD_SSO_SECRET=`sed -n '/export USER_DASHBOARD_SSO_SECRET?=/ {s///p;q;}' .makerc/user-dashboard` \
		docker-compose -f ${COMPOSE_FILE} up -d --force-recreate; \
	else \
		docker-compose -f ${COMPOSE_FILE} up -d --force-recreate; \
	fi
	echo "Now you can visit operator-dashboard at localhost:8080, or user-dashboard at localhost:8081"
	@$(MAKE) start-nfs

stop: ##@Service Stop service
	echo "Stop all services with ${COMPOSE_FILE}..."
	docker-compose -f ${COMPOSE_FILE} stop
	echo "Remove all services with ${COMPOSE_FILE}..."
	docker-compose -f ${COMPOSE_FILE} rm -f -a

restart: stop start ##@Service Restart service

setup-master: ##@Environment Setup dependency for master node
	cd scripts/master_node && bash setup.sh

setup-worker: ##@Environment Setup dependency for worker node
	cd scripts/worker_node && bash setup.sh $(WORKER_TYPE)

build-admin-js: ##@Nodejs Build admin dashboard js files
	@$(MAKE) initial-env
	bash scripts/master_node/build_js.sh

build-user-dashboard-js: ##@Nodejs Build user dashboard js files
	@$(MAKE) -C user-dashboard/ build-js

watch-mode: ##@Nodejs Run watch mode with js files for react
	bash scripts/master_node/watch_mode.sh

npm-install: ##@Nodejs Install modules with npm package management
	bash scripts/master_node/npm_install.sh
#	@$(MAKE) -C user-dashboard/ npm-install

help: ##@other Show this help.
	@perl -e '$(HELP_FUN)' $(MAKEFILE_LIST)

start-nfs: ##@Service start nfs service
	docker-compose -f docker-compose-files/docker-compose-nfs.yml up -d --no-recreate

stop-nfs: ##@Service stop nfs service
	docker-compose -f docker-compose-files/docker-compose-nfs.yml down

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

.PHONY: \
	all \
	check \
	clean \
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
