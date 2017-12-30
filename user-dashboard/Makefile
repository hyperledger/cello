build-js:
	sudo rm -rf ./js/node_modules ./js/login/node_modules ./js/dashboard/node_modules ./js/home/node_modules
	docker-compose -f docker-compose-files/docker-compose-build-js.yaml up --force-recreate

npm-install:
	docker-compose -f docker-compose-files/docker-compose-npm-install.yaml up
