# Deployment

*Here we describe the deployment setups for development usage. If you want to deploy Cello for production, please also refer to the [Production Configuration](production_config.md).*

Cell follows a typical Master-Worker architecture. Hence there will be two types of Nodes.

* Master Node: Manage (e.g., create/delete) the chains inside Work Nodes, with Web dashboard on port `8080` and RESTful api on port `80`;
* Worker Node: Chain providers, now support Docker Host or Swarm Cluster. The Docker service should be accessible from port `2375` from the Master Node.

![Deployment topology](imgs/deployment_topo.png)

For each Node, it is suggested as a Linux-based (e.g., Ubuntu 14.04+) server/vm: 


## Worker Node
Currently we support Docker Host or Swarm Cluster as Worker Node. More types will be added soon.

For the Worker Node with meeting the [system requirements](#system-requirements), three steps are required:

* [Docker daemon setup](#docker-daemon-setup)
* [Docker images pulling](#docker-images-pulling)
* [Firewall Setup](#firewall-setup)

### System Requirements
* Hardware: 8c16g100g
* Docker engine:
    - 1.12.0+
* aufs-tools (optional): Only required on ubuntu 14.04.

### Docker Daemon Setup

Let Docker daemon listen on port 2375, and make sure Master can reach Worker Node through this port. 

#### Ubuntu 14.04 
Simple add this line into your Docker config file `/etc/default/docker`.

```sh
DOCKER_OPTS="$DOCKER_OPTS -H tcp://0.0.0.0:2375 -H unix:///var/run/docker.sock --api-cors-header='*' --default-ulimit=nofile=8192:16384 --default-ulimit=nproc=8192:16384"
```

Then restart the docker daemon with:

```sh
$ sudo service docker restart
```

#### Ubuntu 16.04
Update `/etc/systemd/system/docker.service.d/override.conf` like

```
[Service]
DOCKER_OPTS="$DOCKER_OPTS -H tcp://0.0.0.0:2375 -H unix:///var/run/docker.sock --api-cors-header='*' --default-ulimit=nofile=8192:16384 --default-ulimit=nproc=8192:16384"
EnvironmentFile=-/etc/default/docker
ExecStart=
ExecStart=/usr/bin/dockerd -H fd:// $DOCKER_OPTS
```

Regenerate the docker service script and restart the docker engine:
 
```sh
$ sudo systemctl daemon-reload
$ sudo systemctl restart docker.service
```

At last, run the follow test at Master node and get OK response, to make sure it can access Worker node successfully.

```sh
[Master] $ docker -H Worker_Node_IP:2375 version
```

### Docker Images Pulling
Pulling the following images.

```bash
$ docker pull hyperledger/fabric-peer:x86_64-0.6.1-preview \
  && docker pull hyperledger/fabric-membersrvc:x86_64-0.6.1-preview \
  && docker pull yeasy/blockchain-explorer:latest \
  && docker tag hyperledger/fabric-peer:x86_64-0.6.1-preview hyperledger/fabric-peer \
  && docker tag hyperledger/fabric-peer:x86_64-0.6.1-preview hyperledger/fabric-baseimage \
  && docker tag hyperledger/fabric-membersrvc:x86_64-0.6.1-preview hyperledger/fabric-membersrvc
```

### Firewall Setup
Make sure ip forward is enabled, you can simply run the follow command.

```sh
$ sysctl -w net.ipv4.ip_forward=1
```
And check the os iptables config, to make sure host ports are open (e.g., 2375, 7050~10000)

## Master Node
The Master Node includes several services: 

* dashboard: Provide Web UI for operators.
* restserver: Provide RESTful APIs for chain consumers.
* watchdog: Watch for health checking.

More details can be found at the [architecture doc](docs/arch.md).

It can be deployed by in 3 steps.

* Clone code
* Pull Docker images
* Run setup script

### System Requirement
* Hardware: 8c16g100g
* Docker engine: 1.12.0+
* docker-compose: 1.7.0+

### Clone Code

You may check `git` and `make` are installed to clone the code.

```sh
$ sudo aptitude install git make -y
$ git clone http://gerrit.hyperledger.org/r/cello && cd cello
```

### Docker images pulling

Pull the following images

```bash
$ docker pull python:3.5 \
	&& docker pull mongo:3.2 \
	&& docker pull yeasy/nginx:latest \
	&& docker pull mongo-express:0.30
```

*Note: mongo-express:0.30 is for debugging the db, which is optional for basic setup.*

### Run Setup

For the first time running, please setup the master node with

```sh
$ make setup
```

Make sure there is no error during the setup. Otherwise, please check the log msgs.

### Usage

#### Start/Restart
To (re)start the whole services, please run

```sh
$ make restart
```

#### Deploy/Redploy
To (re)deploy one specific service, e.g., dashboard, please run

```sh
$ make redeploy service=dashboard
```

#### Check Logs
To check the logs for all the services, please run

```sh
$ make logs
```

To check the logs for one specific service, please run
```sh
$ make log service=watchdog
```

Now you can access the `MASTER_NODE_IP:8080` to open the Web-based [operational dashboard](docs/dashboard.md).

### Configuration
The application configuration can be imported from file named `CELLO_CONFIG_FILE`.

By default, it also loads the `config.py` file as the configurations.

### Data Storage
The mongo container will use local `/opt/cello/mongo` directory for persistent storage. 

Please keep it safe by backups or using more high-available solutions.
