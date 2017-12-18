# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

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
BASE_VERSION=0.8.0
VERSION ?= 0.8.0
IS_RELEASE=false

DOCKER_BASE_x86_64=ubuntu:xenial
DOCKER_BASE_ppc64le=ppc64le/ubuntu:xenial
DOCKER_BASE_s390x=s390x/debian:jessie
DOCKER_BASE=$(DOCKER_BASE_$(ARCH))
BASE_VERSION ?= $(ARCH)-$(VERSION)

ifneq ($(IS_RELEASE),true)
	EXTRA_VERSION ?= snapshot-$(shell git rev-parse --short HEAD)
	DOCKER_TAG=$(BASE_VERSION)-$(EXTRA_VERSION)
else
	DOCKER_TAG=$(BASE_VERSION)
endif

DOCKER_IMAGES = baseimage mongo nginx
DUMMY = .$(DOCKER_TAG)

ifeq ($(DOCKER_BASE), )
$(error "Architecture \"$(ARCH)\" is unsupported")
endif

# Frontend needed
SLASH:=/
REPLACE_SLASH:=\/
export ROOT_PATH = ${PWD}
ROOT_PATH_REPLACE=$(subst $(SLASH),$(REPLACE_SLASH),$(ROOT_PATH))
THEME?=basic
STATIC_FOLDER?=themes\/${THEME}\/static
TEMPLATE_FOLDER?=themes\/${THEME}\/templates
NPM_REGISTRY?=registry.npmjs.org
DEV?=True

# macOS has diff `sed` usage from Linux
SYSTEM=$(shell uname)
ifeq ($(SYSTEM), Darwin)
	SED = sed -ix
else
	SED = sed -i
endif

ifneq (${THEME}, basic)
	ifneq ($(wildcard ./src/${STATIC_FOLDER}/node_modules),)
		INSTALL_NPM=
	else
		INSTALL_NPM=npm-install
	endif
	ifeq (${THEME}, react)
		ifneq ($(wildcard ./src/${STATIC_FOLDER}/js/dist),)
			BUILD_JS=
		else
			BUILD_JS=build-js
		endif
	else
		ifneq ($(wildcard ./src/${STATIC_FOLDER}/dist),)
			BUILD_JS=
		else
			BUILD_JS=build-js
		endif
	endif
	START_OPTIONS = initial-env $(INSTALL_NPM) $(BUILD_JS)
else
	START_OPTIONS = initial-env
endif


all: check

build/docker/baseimage/$(DUMMY): build/docker/baseimage/$(DUMMY)
build/docker/nginx/$(DUMMY): build/docker/nginx/$(DUMMY)
build/docker/mongo/$(DUMMY): build/docker/mongo/$(DUMMY)

build/docker/%/$(DUMMY):
	$(eval TARGET = ${patsubst build/docker/%/$(DUMMY),%,${@}})
	$(eval DOCKER_NAME = $(BASENAME)-$(TARGET))
	@mkdir -p $(@D)
	@echo "Building docker $(TARGET)"
	@cat config/$(TARGET)/Dockerfile.in \
		| sed -e 's|_DOCKER_BASE_|$(DOCKER_BASE)|g' \
		| sed -e 's|_NS_|$(DOCKER_NS)|g' \
		| sed -e 's|_TAG_|$(DOCKER_TAG)|g' \
		> $(@D)/Dockerfile
	docker build -f $(@D)/Dockerfile \
		-t $(DOCKER_NAME) \
		-t $(DOCKER_NAME):$(DOCKER_TAG) \
		.
	@touch $@

build/docker/%/.push: build/docker/%/$(DUMMY)
	@docker login \
		--username=$(DOCKER_HUB_USERNAME) \
		--password=$(DOCKER_HUB_PASSWORD)
	@docker push $(BASENAME)-$(patsubst build/docker/%/.push,%,$@):$(DOCKER_TAG)

docker: $(patsubst %,build/docker/%/$(DUMMY),$(DOCKER_IMAGES))

install: $(patsubst %,build/docker/%/.push,$(DOCKER_IMAGES))

check: docker ##@Code Check code format
	tox
	@$(MAKE) test-case
	make start && sleep 10 && make stop

test-case: ##@Code Run test case for flask server
	@$(MAKE) -C test/ all

clean: ##@Code Clean tox result
	rm -rf .tox .cache *.egg-info build/
	find . -name "*.pyc" -o -name "__pycache__" -exec rm -rf "{}" \;

# TODO (david_dornseier): As long as there are no release versions, always rewrite
# the entire changelog (bug)
changelog: ##@Update the changelog.md file in the root folder
	#bash scripts/changelog.sh bd0c6db v$(PREV_VERSION)
	bash scripts/changelog.sh v$(PREV_VERSION) HEAD

doc: ##@Create local online documentation
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
	$(SED) 's/\(NPM_REGISTRY=\).*/\1${NPM_REGISTRY}/' .env
	$(SED) 's/\(DEV=\).*/\1${DEV}/' .env
	$(SED) 's/\(ROOT_PATH=\).*/\1${ROOT_PATH_REPLACE}/' .env

start: docker ##@Service Start service
	@$(MAKE) $(START_OPTIONS)
	echo "Start all services..."
	docker-compose up -d --no-recreate

stop: ##@Service Stop service
	echo "Stop all services..."
	docker-compose stop
	echo "Remove all services..."
	docker-compose rm -f -a

restart: stop start ##@Service Restart service

setup-master: docker ##@Environment Setup dependency for master node
	cd scripts/master_node && bash setup.sh

setup-worker: ##@Environment Setup dependency for worker node
	cd scripts/worker_node && bash setup.sh

build-js: ##@Nodejs Build js files
	bash scripts/master_node/build_js.sh
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
