# Installation

Cello follows a typical Master-Worker architecture. There are two types of Nodes in the cluster.

* Master Node: Holds [Cello services](service_management.md) to manage (e.g., create/delete) the chains inside Work Nodes. Usually, Master Node will provide Web dashboard (port `8080`) and RESTful api (port `80`). It is recommended to use Linux (e.g., Ubuntu 14.04+) or MacOS;
* Worker Node: Nodes to hold blockchains. Take Docker Host or Swarm Cluster for example, the Docker daemon should be accessible (typically at port `2375`) from the Master Node.

![Deployment topology](imgs/deploy_arch.png)

## Master Node

See [Installation on Master Node](installation_master.md).

## Worker Node

Currently we support Docker Host or Swarm Cluster as Worker Node. More types will be added soon.

* `Docker Host`: See [Installation on Worker Docker Node](installation_worker_docker.md).
* `Docker Swarm `: See [Create a Docker Swarm](https://docs.docker.com/engine/swarm/swarm-tutorial/create-swarm/).
* `Kubernetes`: See [Kubernetes Setup](https://kubernetes.io/docs/setup/).
* `vSphere`: TODO.

## Special Configuration for Production

Here we describe the setups for development usage. If you want to deploy Cello for production, please also refer to the [Production Configuration](production_config.md).

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
