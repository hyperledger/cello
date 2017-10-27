# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
GREEN  := $(shell tput -Txterm setaf 2)
WHITE  := $(shell tput -Txterm setaf 7)
YELLOW := $(shell tput -Txterm setaf 3)
RESET  := $(shell tput -Txterm sgr0)

SLASH:=/
REPLACE_SLASH:=\/
export ROOT_PATH = ${PWD}
ROOT_PATH_REPLACE=$(subst $(SLASH),$(REPLACE_SLASH),$(ROOT_PATH))
THEME?=basic
STATIC_FOLDER?=themes\/${THEME}\/static
TEMPLATE_FOLDER?=themes\/${THEME}\/templates
NPM_REGISTRY?=registry.npmjs.org
DEV?=True
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

# changelog specific version tags
PREV_VERSION=0.6
BASE_VERSION=

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

all: check

check: ##@Code Check code format
	tox
	@$(MAKE) test-case
	make start && sleep 10 && make stop

test-case: ##@Code Run test case for flask server
	@$(MAKE) -C test/ all

clean: ##@Code Clean tox result
	rm -rf .tox .cache *.egg-info
	find . -name "*.pyc" -o -name "__pycache__" -exec rm -rf "{}" \;

# TODO (david_dornseier): As long as there are no release versions, always rewrite
# the entire changelog (bug)
changelog: ##@Update the changelog.md file in the root folder
	rm -rf CHANGELOG.md
	bash scripts/changelog.sh bd0c6db v$(PREV_VERSION)
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

image-clean: ##@Clean all existing images to rebuild
	echo "Clean all cello related images, may need to remove all containers before"
	docker images | grep "cello-" | awk '{print $1}' | xargs docker rmi -f
	docker rmi $(docker images -f dangling=true -q)

initial-env: ##@Configuration Initial Configuration for dashboard
	$(SED) 's/\(STATIC_FOLDER=\).*/\1${STATIC_FOLDER}/' .env
	$(SED) 's/\(TEMPLATE_FOLDER=\).*/\1${TEMPLATE_FOLDER}/' .env
	$(SED) 's/\(NPM_REGISTRY=\).*/\1${NPM_REGISTRY}/' .env
	$(SED) 's/\(DEV=\).*/\1${DEV}/' .env
	$(SED) 's/\(ROOT_PATH=\).*/\1${ROOT_PATH_REPLACE}/' .env

start: ##@Service Start service
	@$(MAKE) $(START_OPTIONS)
	echo "Start all services..."
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

build-js: ##@Nodejs Build js files
	bash scripts/master_node/build_js.sh
	@$(MAKE) -C user-dashboard/ build-js

watch-mode: ##@Nodejs Run watch mode with js files for react
	bash scripts/master_node/watch_mode.sh

npm-install: ##@Nodejs Install modules with npm package management
	bash scripts/master_node/npm_install.sh
	@$(MAKE) -C user-dashboard/ npm-install

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

help: ##@other Show this help.
	@perl -e '$(HELP_FUN)' $(MAKEFILE_LIST)
