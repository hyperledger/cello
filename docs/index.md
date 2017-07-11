Welcome to Hyperledger Cello
===

Hyperledger Cello is a blockchain provision and operational system, which helps provide Blockchain as a Service.

Hyperledger Cello is designed with the following features:

* Manage the lifecycle of blockchains, e.g., create/start/stop/delete/keep health automatically.
* Support customized (e.g., size, consensus) blockchains request, currently we mainly support [Hyperledger fabric](https://github.com/hyperledger/fabric).
* Support native Docker host, swarm or Kubernetes as the worker nodes. More supports on the way.
* Support heterogeneous architecture, e.g., X86, POWER and Z, from bare-metal servers to virtual machines.
* Extend with monitor, log, health and analytics features by employing additional components.

Using Cello, every Blockchain application developer can:

* Provision customizable Blockchains instantly, e.g., a Hyperledger fabric network.
* Maintain a pool of running blockchains atop of baremetals, vms, Docker Swarm and Kubernetes.
* Check the system status, adjust the chain numbers, scale-out resources... through a dashboard.

A typical usage scenario is illustrated as:

![Typical Scenario](imgs/scenario.png)

## Getting Started

For new users, it is highly recommended to read the [tutorial](docs/tutorial) first.

## Operational Guideline
* [Installation Steps](installation)
* [Terminologies List](terminology)
* [Adoption Scenarios](scenario)
* [Production Configuration](production_config)

## Development Guideline
* [How to contribute](CONTRIBUTING)
* [Architecture Design](arch)
* [Database Model](db)
* [API](api/restserver_v2)
* [Develop react js](reactjs)
* [pep8 style guide](https://www.python.org/dev/peps/pep-0008/), [Coding Style](code_style)

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
