## Makefile Commands

### help

Show all help messages of make command.

```bash
usage: make [target]

Building:
  dockerhub                       latest docker images as hosted in dockerhub

Clean:
  docker-clean                    all existing images
  image-clean                     all existing images to rebuild

Code:
  check                           Check code format
  test-case                       Run test case for flask server
  clean                           Clean tox result

Configuration:
  initial-env                     Initial Configuration for dashboard

Create:
  doc                             local online documentation and start serve

Environment:
  reset                           clean up and remove local storage (only use for development)
  setup-master                    Setup dependency for master node
  setup-worker                    Setup dependency for worker node

Generate:
  common-docker                   docker images locally
  agent-docker                    docker images locally

Log:
  log                             tail special service log, Use like "make log service=dashboard"
  logs                            tail for all service log

Pull:
  dockerhub-pull                  service images from dockerhub

Service:
  start                           Start service
  stop                            Stop service
  restart                         Restart service

Update:
  changelog                       the changelog.md file in the root folder

other:
  help                            Show this help.
```

### start

### stop

### restart

### docker

Build all needed docker images by cello service, include master server deployment, and all agent images, run [common-docker](#116-common-docker) & [agent-docker](#117-agent-docker).

### common-docker

Build docker images for master server, and the prefix of image is `hyperledger/cello-`.

And you can build common docker image separately, through `#!bash make common-docker-xxx`, such as:

```bash
$ make common-docker-api-engine # build api engine docker image
```

### agent-docker

Build docker images for all agents, and the prefix of image is `hyperledger/cello-agent-`.

### dockerhub

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
