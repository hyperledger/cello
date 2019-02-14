## Setup Docker Host as a Worker Node

TLDR: `WORKER_TYPE=docker MASTER_NODE=x.x.x.x make setup-worker`

For the Worker Node with meeting the [system requirements](#system-requirements), three steps are required:

* [Docker daemon setup](#docker-daemon-setup)
* [Docker images pulling](#docker-images-pulling)
* [Firewall Setup](#firewall-setup)

### System Requirements
* Hardware: 4c8g50g
* Docker engine:
    - 1.10.0~1.18.6

### Docker Daemon Setup

Let Docker daemon listen on port 2375, and make sure Master can reach Worker Node through this port.

#### Ubuntu 18.04
Edit systemd service config file `/lib/systemd/system/docker.service`, update the `ExecStart` line under section `[Service]`, as the following:

```
[Service]
ExecStart=/usr/bin/dockerd -H fd:// -H unix:///var/run/docker.sock -H tcp://0.0.0.0:2375 --default-ulimit=nofile=8192:16384 --default-ulimit=nproc=8192:16384
```

#### Ubuntu 16.04
Edit systemd service config file `/lib/systemd/system/docker.service`, update the `ExecStart` line under section `[Service]`, as the following:

```
[Service]
ExecStart=/usr/bin/dockerd -H fd:// -H unix:///var/run/docker.sock -H tcp://0.0.0.0:2375 --default-ulimit=nofile=8192:16384 --default-ulimit=nproc=8192:16384
```

Regenerate the docker service script and restart the docker engine:

```bash
$ sudo systemctl daemon-reload; sudo systemctl restart docker.service
```

### Alternatively (for all Linux distro):
This will run the docker-daemon on port 2375 as long as the system is restarted or docker-daemon is killed.

```bash
$ sudo systemctl stop docker.service
$ sudo dockerd -H fd:// -H unix:///var/run/docker.sock -H tcp://0.0.0.0:2375 --default-ulimit=nofile=8192:16384 --default-ulimit=nproc=8192:16384 -D &
```

At last, run the follow test at Master node and get OK response, to make sure it can access the Worker node successfully.

```bash
[Master] $ docker -H Worker_Node_IP:2375 info
```

### Setup
Run the following cmd to pull the necessary images and copy required artifacts.

```bash
$ MASTER_NODE=xx.xx.xx.xx make setup-worker
```

### Firewall Setup
Make sure ip forward is enabled, you can simply run the follow command.

```bash
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

And users can use  `0.0.0.0` to replace `127.0.0.1` to make sure Master can reach Worker Node through this port, as Ubuntu.

```bash
$ docker run -d -v /var/run/docker.sock:/var/run/docker.sock -p 0.0.0.0:2375:2375 bobrik/socat TCP-LISTEN:2375,fork UNIX-CONNECT:/var/run/docker.sock
```

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
