# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
#
# -------------------------------------------------------------
# This makefile defines the following targets
#
#   - all (default):  Builds all targets and runs all tests/checks
#   - checks:         Setup as master node, and runs all tests/checks, will be triggered by CI
#   - clean:          Cleans the build area
#   - doc:            Start a local web service to explore the documentation
#   - docker[-clean]: Build/clean docker images locally
#   - help:           Output the help instructions for each command
#   - log:            Check the recent log output of all services
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

# changelog specific version tags
PREV_VERSION=0.7

# Building image usage
DOCKER_NS ?= hyperledger
BASENAME ?= $(DOCKER_NS)/cello
VERSION ?= 0.8.0
IS_RELEASE=false

DOCKER_BASE_x86_64=ubuntu:xenial
DOCKER_BASE_ppc64le=ppc64le/ubuntu:xenial
DOCKER_BASE_s390x=s390x/debian:jessie
DOCKER_BASE=$(DOCKER_BASE_$(ARCH))
BASE_VERSION ?= $(ARCH)-$(VERSION)

ifeq ($(IS_RELEASE),false)
	EXTRA_VERSION ?= snapshot-$(shell git rev-parse --short HEAD)
	IMG_TAG=$(BASE_VERSION)-$(EXTRA_VERSION)
else
	IMG_TAG=$(BASE_VERSION)
endif

# Docker images needed to run cello services
DOCKER_IMAGES = baseimage mongo nginx
DUMMY = .$(IMG_TAG)

ifeq ($(DOCKER_BASE), )
	$(error "Architecture \"$(ARCH)\" is unsupported")
endif

# Frontend needed
SLASH:=/
REPLACE_SLASH:=\/

-include .makerc/email
-include .makerc/admin-dashboard
-include .makerc/user-dashboard

export ROOT_PATH = ${PWD}
ROOT_PATH_REPLACE=$(subst $(SLASH),$(REPLACE_SLASH),$(ROOT_PATH))

# macOS has diff `sed` usage from Linux
SYSTEM=$(shell uname)
ifeq ($(SYSTEM), Darwin)
	SED = sed -ix
else
	SED = sed -i
endif

ifeq (${THEME}, basic) # basic theme doesn't need js compiling
	START_OPTIONS = initial-env
else
	ifeq (${THEME}, react) # react needs compiling js first
		ifneq ($(wildcard ./src/${STATIC_FOLDER}/js/dist),)
			BUILD_JS=
		else
			BUILD_JS=build-admin-js build-user-dashboard-js
		endif
	else
		ifneq ($(wildcard ./src/${STATIC_FOLDER}/dist),)
			BUILD_JS=
		else
			BUILD_JS=build-admin-js build-user-dashboard-js
		endif
	endif
	START_OPTIONS = initial-env $(BUILD_JS)
endif


all: check

build/docker/baseimage/$(DUMMY): build/docker/baseimage/$(DUMMY)
build/docker/nginx/$(DUMMY): build/docker/nginx/$(DUMMY)
build/docker/mongo/$(DUMMY): build/docker/mongo/$(DUMMY)

build/docker/%/$(DUMMY): ##@Build an image locally
	$(eval TARGET = ${patsubst build/docker/%/$(DUMMY),%,${@}})
	$(eval IMG_NAME = $(BASENAME)-$(TARGET))
	@mkdir -p $(@D)
	@echo "Building docker $(TARGET)"
	@cat config/$(TARGET)/Dockerfile.in \
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

docker-clean: image-clean ##@Clean all existing images

install: $(patsubst %,build/docker/%/.push,$(DOCKER_IMAGES))

check: setup-master ##@Code Check code format
	tox
	@$(MAKE) test-case
	make start && sleep 10 && make stop

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
	docker-compose logs -f ${service} --tail=200

logs: ##@Log tail for all service log
	docker-compose logs -f --tail=200

# Use like "make redeploy service=dashboard"
redeploy: ##@Service Redeploy single service, Use like "make redeploy service=dashboard"
	bash scripts/master_node/redeploy.sh ${service}

image-clean: clean ##@Clean all existing images to rebuild
	echo "Clean all cello related images, may need to remove all containers before"
	docker images | grep "hyperledger/cello-" | awk '{print $3}' | xargs docker rmi -f

initial-env: ##@Configuration Initial Configuration for dashboard
	cp default.env .env
	$(SED) 's/\(STATIC_FOLDER=\).*/\1${STATIC_FOLDER}/' .env
	$(SED) 's/\(TEMPLATE_FOLDER=\).*/\1${TEMPLATE_FOLDER}/' .env
	$(SED) 's/\(NPM_REGISTRY=\).*/\1${NPM_REGISTRY_REPLACE}/' .env
	$(SED) 's/\(DEV=\).*/\1${DEV}/' .env
	$(SED) 's/\(ROOT_PATH=\).*/\1${ROOT_PATH_REPLACE}/' .env
	$(SED) 's/\(ENABLE_EMAIL_ACTIVE=\).*/\1${ENABLE_EMAIL_ACTIVE}/' .env
	$(SED) 's/\(SMTP_SERVER=\).*/\1${SMTP_SERVER}/' .env
	$(SED) 's/\(SMTP_PORT=\).*/\1${SMTP_PORT}/' .env
	$(SED) 's/\(SMTP_AUTH_USERNAME=\).*/\1${SMTP_AUTH_USERNAME}/' .env
	$(SED) 's/\(SMTP_AUTH_PASSWORD=\).*/\1${SMTP_AUTH_PASSWORD}/' .env
	$(SED) 's/\(FROM_EMAIL=\).*/\1${FROM_EMAIL}/' .env
	$(SED) 's/\(WEBROOT=\).*/\1${WEBROOT}/' .env
	$(SED) 's/\(THEME=\).*/\1${THEME}/' .env

start: ##@Service Start service
	@$(MAKE) $(START_OPTIONS)
	echo "Start all services... docker images must exist local now, otherwise, run 'make setup-master first' !"
	docker-compose up -d --no-recreate

stop: ##@Service Stop service
	echo "Stop all services..."
	docker-compose stop
	echo "Remove all services..."
	docker-compose rm -f -a

restart: stop start ##@Service Restart service

setup-master: ##@Environment Setup dependency for master node
	cd scripts/master_node && bash setup.sh

setup-worker: ##@Environment Setup dependency for worker node
	cd scripts/worker_node && bash setup.sh

build-admin-js: ##@Nodejs Build admin dashboard js files
	@$(MAKE) initial-env
	bash scripts/master_node/build_js.sh

build-user-dashboard-js: ##@Nodejs Build user dashboard js files
	@$(MAKE) -C user-dashboard/ build-js

watch-mode: ##@Nodejs Run watch mode with js files for react
	bash scripts/master_node/watch_mode.sh

npm-install: ##@Nodejs Install modules with npm package management
	bash scripts/master_node/npm_install.sh
	@$(MAKE) -C user-dashboard/ npm-install

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

.PHONY: \
	all \          # default to run check
	check \        # ci checking
	clean \        # clean up the env, remove temp files
	changelog \    # update the changelog based on the VERSION tags
	doc \          # start a doc server locally
	image-clean \  # clean up all cello related images
	log \          # show logs of specify service
	logs \         # show logs of all services
	setup-master \ # setup the master node
	setup-worker \ # setup the worker node
	redeploy \     # redeploy service(s)
	start \        # start all services
	restart \      # restart all services
	stop \         # stop all services
	docker \       # create docker image
