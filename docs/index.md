Welcome to Hyperledger Cello
===

Hyperledger Cello is a blockchain provision and operation system, which helps manage blockchain networks.

Hyperledger Cello is designed with the following features:

* Manage the lifecycle of blockchains, e.g., create/start/stop/delete/keep health automatically.
* Support customized (e.g., size, consensus) blockchains request, currently we mainly support [Hyperledger fabric](https://github.com/hyperledger/fabric).
* Support native Docker host, swarm or Kubernetes as the worker nodes. More supports on the way.
* Support heterogeneous architecture, e.g., X86, POWER and Z, from bare-metal servers to virtual machine clouds.
* Extend with monitor, log, health and analytics features by employing additional components.

Using Cello, every Blockchain application developer can:

* Build up a Blockchain as a Service (BaaS) platform quickly from the scratch.
* Provision customizable Blockchains instantly, e.g., a Hyperledger fabric network v1.0.
* Maintain a pool of running blockchain networks on top of baremetals, Virtual Clouds (e.g., virtual machines, vsphere Clouds), Container clusters (e.g., Docker, Swarm, Kubernetes).
* Check the system status, adjust the chain numbers, scale resources... through dashboards.

A typical usage scenario is illustrated as:

![Typical Scenario](imgs/scenario.png)

## Getting Started

For new users, it is highly recommended to read the [tutorial](tutorial) first.

## Operational Guideline
* [New User Tutorial](tutorial)
* [Installation Steps](installation)
* [Terminologies List](terminology)
* [Adoption Scenarios](scenario)
* [Production Configuration](production_config)

## Development Guideline
* [How to contribute](CONTRIBUTING)
* [Architecture Design](arch)
* [Database Model](db)
* [API Design](api/restserver_v2)
* [Wikipage](https://wiki.hyperledger.org/projects/cello)
* [Develop react js](reactjs)
* [Coding Style](code_style)
* [Pep8 style guide](https://www.python.org/dev/peps/pep-0008/)

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
