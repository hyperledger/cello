## Setup Docker Host as Worker Node

For the Worker Node with meeting the [system requirements](#system-requirements), three steps are required:

* [Docker daemon setup](#docker-daemon-setup)
* [Docker images pulling](#docker-images-pulling)
* [Firewall Setup](#firewall-setup)

### System Requirements
* Hardware: 8c16g100g
* Docker engine:
    - 1.10.0~1.13.0
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
Update `/lib/systemd/system/docker.service` like

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

### Alternatively (for all Linux distro):
This will run the docker-daemon on port 2375 as long as the system is restarted or docker-daemon is killed.

```sh
$ sudo systemctl stop docker.service
$ sudo dockerd -H tcp://0.0.0.0:2375 -H unix:///var/run/docker.sock --api-cors-header='*' --default-ulimit=nofile=8192:16384 --default-ulimit=nproc=8192:16384 -D &
```

At last, run the follow test at Master node and get OK response, to make sure it can access Worker node successfully.

```sh
[Master] $ docker -H Worker_Node_IP:2375 info
```

### Setup
Run the following cmd to pull the necessary images and copy required artifacts.

```bash
$ make setup-worker
```

### Firewall Setup
Make sure ip forward is enabled, you can simply run the follow command.

```sh
$ sysctl -w net.ipv4.ip_forward=1
```
And check the os iptables config, to make sure host ports are open (e.g., 2375, 7050~10000)

### Work with MacOS

In MacOS, [Docker](https://docs.docker.com/docker-for-mac/networking/#known-limitations-use-cases-and-workarounds) currently provides no support to config the daemon to listen from network.

Users need to use some tools to config Docker daemon to listen at network manually, e.g., to config Docker daemon to listen on `127.0.0.1:2375`,

```bash
$ docker run -d -v /var/run/docker.sock:/var/run/docker.sock -p 127.0.0.1:2375:2375 bobrik/socat TCP-LISTEN:2375,fork UNIX-CONNECT:/var/run/docker.sock
$ docker -H 127.0.0.1:2375 info
```

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
