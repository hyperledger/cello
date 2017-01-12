.PHONY: \
	all \
	check \
	clean \
	log \
	logs \
	redeploy \
	restart \
	setup \

all: check

check:
	tox

clean:
	rm -rf .tox

# Use like "make log service=dashboard"
log:
	docker-compose logs -f ${service} --tail=100

logs:
	docker-compose logs -f --tail=100

# Use like "make redeploy service=dashboard"
redeploy:
	bash scripts/redeploy.sh ${service}

start:
	bash scripts/start.sh

stop:
	bash scripts/stop.sh

restart: stop start

setup:
	bash scripts/setup.sh
