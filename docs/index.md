Welcome to Hyperledger Cello
===

Hyperledger Cello is a blockchain provision and operation system, which helps manage blockchain networks in an efficient way.

![Typical Scenario](imgs/scenario.png)

Hyperledger Cello provides the following features:

* Manage the lifecycle of blockchain networks (mainly support [Hyperledger fabric](https://github.com/hyperledger/fabric) now), e.g., `create/start/stop/delete/keep health` automatically.
* Support customized blockchain network, e.g., network size, consensus type.
* Support multiple underly infrastructure including bare-metal, virtual machine, native [Docker](https://www.docker.com) host, swarm or [Kubernetes](https://kubernetes.io). More supports on the way.
* Support heterogeneous architecture, e.g., X86, POWER and Z, from bare-metal servers to virtual machine clouds.
* Extendable with monitoring, logging, health and analytics capability by integrating with existing tools like [ELK](https://www.elastic.co).

Using Cello, application developers can:

* Build up a Blockchain as a Service (BaaS) platform quickly from scratch.
* Provision customizable Blockchains instantly, e.g., a Hyperledger fabric network v1.0.x.
* Maintain a pool of running blockchain networks on top of bare-metals, virtual clouds (e.g., virtual machines, vsphere Clouds), container clusters (e.g., Docker, Swarm, Kubernetes).
* Check the system status, adjust the chain numbers, scale resources... through dashboards.

## [Getting Started](tutorial)

For new users, it is highly recommended to read the [Tutorial for Beginners](tutorial) first.

## Operation Guideline
* [Terminology and Concept](terminology.md)
* [Start Cello](setup.md)
* [Adoption Scenarios](scenario.md)
* [Configuration for Production](production_config.md)
* [Manage Cello services](service_management.md)
* [Operator Dashboard operate](dashboard_operator.md)
* [User Dashboard operate](dashboard_user.md)

## Contribute to the Project
* [How to Contribute](CONTRIBUTING.md)
* [Code Style Guide](https://www.python.org/dev/peps/pep-0008/)
* [Develop react js](reactjs.md)
* [Develop vue theme](vue/index.md)

## Design Documentation
* [Architecture Design](arch.md)
* [Database Model](db.md)
* [API Design](api/rest_api_v2.md)

## Communication Channels

For additional helps, feel free to take the following channels:

* [Wikipage](https://wiki.hyperledger.org/projects/cello): Lots of information and documentation about the project.
* [Jira Board](https://jira.hyperledger.org/projects/CE/issues): Find development status, report bug, or help contribute code.
* [Mail List](mailto:hyperledger-cello@lists.hyperledger.org): General discussions with Cello project.
* [Rocket.Chat channels](https://chat.hyperledger.org/channel/cello): Real-time technical conversations.

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
