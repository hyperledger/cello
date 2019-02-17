## Supported Make Commands

The following opperations are supported by [Make](https://en.wikipedia.org/wiki/Makefile) command. Prepend the following commands with make.

These commands should be run in `cello` directory, for example: `/cello $ make all`.

### all
Default to run the testing cases.

### build-js
Builds js files for react.

### check
CI checking. Runs the following commands. This runs the following commands for you.

```bash
$ tox
$ make start && sleep 10 && make stop
```

### clean
Cleans up the environment and removes temp files like .cache, .tox, .pyc.
It runs the following commands for you.

```bash
$ rm -rf .tox .cache *.egg-info
$ find . -name "*.pyc" -o -name "__pycache__" -exec rm -rf "{}" \;
```

### doc
Starts a doc server locally. It runs the following commands for you.

```bash
$ pip install mkdocs
$ mkdocs serve
```

### help
Show help.

### image-clean
Cleans up all cello related docker images. It runs the following commands for you.

```bash
$ docker images | grep "cello-" | awk '{print $1}' | xargs docker rmi -f
$ docker rmi $(docker images -f dangling=true -q)
```

### log
Shows logs of specified service. To view logs from `Dashboard` service, use: `make log service=dashboard`.

### logs
Shows logs of all services.

### setup-master
Sets up the master node. Run on Master node. It runs the following command for you.

```bash
$ cd scripts/master_node && bash setup.sh
```

### setup-worker
Sets up the worker node. Run on Worker node. It runs the following commands for you.

```bash
$ cd scripts/worker_node && bash setup.sh
```

### redeploy
Redeploys specified service(s). To redeploy `Dashboard` service, use: `make redeploy service=dashboard`.

### start
Starts all services, include nfs server. Runs following command for you.

```bash
$ docker-compose up -d --no-recreate
```

### reset
Clean up (i.e., make clean) and remove all local storage, please only use for development purpose.

### restart
Restarts all services.

### stop
Stops all services and removes stopped service containers.
Runs the following commands for you.
`docker-compose stop`, `docker-compose rm -f -a`.

### watch-mode
Runs watch mode with js files for react.

### npm-install
Installs modules with npm package management.

### start-nfs
Start NFS server manually.

### stop-nfs
Stop NFS Server manually.