![Cello](docs/imgs/logo.png)

Cello is a blockchain provision and operational system, which helps provide Blockchain as a Service.

**Note:** This is a **read-only mirror** of the formal [Gerrit](https://gerrit.hyperledger.org/r/#/admin/projects/cello) repository. Find more details at [Cello Wiki](https://wiki.hyperledger.org/projects/cello).

## Introduction

Using Cello, everyone can:

* Provision customizable Blockchains instantly, e.g., a Hyperledger fabric network.
* Maintain a pool of running blockchains atop of baremetals, vms, Docker Swarm and Kubernetes.
* Check the system status, scale the chain numbers, change resources... through a dashboard.

![Typical Scenario](docs/imgs/scenario.png)

Explore more [scenarios](docs/scenario.md).

## Main Features

* Manage the lifecycle of blockchains, e.g., create/delete/keep health automatically.
* Response nearly instantly, even with hundreds of chains, or nodes.
* Support customized (e.g., size, consensus) blockchains request, currently we support [hyperledger fabric](https://github.com/hyperledger/fabric).
* Support native Docker host or swarm host as the compute nodes, more supports on the way.
* Support heterogeneous architecture, e.g., Z, Power and X86, from bare-metal servers to virtual machines.
* Extend with monitor/log/health features by employing additional components.

## Documentation

For new users, it is highly recommended to read the [tutorial](docs/tutorial.md) first.

### User Docs
* [Installation & Deployment](docs/installation.md)
* [Terminologies](docs/terminology.md)
* [Adoption Scenarios](docs/scenario.md)
* [Production Configuration](docs/production_config.md)

### Development Docs
* [How to contribute](docs/CONTRIBUTING.md)
* [Architecture Design](docs/arch.md)
* [Database Model](docs/db.md)
* [API](api/restserver_v2.md)
* [Develop react js](docs/reactjs.md)
* [pep8 style guide](https://www.python.org/dev/peps/pep-0008/), [Coding Style](docs/code_style.md)

## Why named Cello?
Can you find anyone better at playing chains? :)

## Incubation Notice
This project is a Hyperledger project in _Incubation_. It was proposed to the community and documented [here](https://docs.google.com/document/d/1E2i5GRqWsIag7KTxjQ_jQdDiWcuikv3KqXeuw7NaceM/edit), and was approved by [Hyperledger TSC at 2017-01-07](https://lists.hyperledger.org/pipermail/hyperledger-tsc/2017-January/000535.html). Information on what _Incubation_ entails can be found in the [Hyperledger Project Lifecycle document](https://goo.gl/4edNRc).

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
