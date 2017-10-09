Welcome to Hyperledger Cello
===

Hyperledger Cello is a blockchain provision and operation system, which helps manage blockchain networks.

![Typical Scenario](imgs/scenario.png)

Hyperledger Cello is designed with the following features:

* Manage the lifecycle of blockchains, e.g., create/start/stop/delete/keep health automatically.
* Support customized (e.g., size, consensus) blockchains request, currently we mainly support [Hyperledger fabric](https://github.com/hyperledger/fabric).
* Support bare-metal, virtual machine, native [Docker](https://www.docker.com/) host, swarm or [Kubernetes](https://kubernetes.io/) as the worker nodes. More supports on the way.
* Support heterogeneous architecture, e.g., X86, POWER and Z, from bare-metal servers to virtual machine clouds.
* Extend with monitor, log, health and analytics features by employing additional components.

Using Cello, Blockchain application developers can:

* Build up a Blockchain as a Service (BaaS) platform quickly from the scratch.
* Provision customizable Blockchains instantly, e.g., a Hyperledger fabric network v1.0.
* Maintain a pool of running blockchain networks on top of baremetals, virtual clouds (e.g., virtual machines, vsphere Clouds), container clusters (e.g., Docker, Swarm, Kubernetes).
* Check the system status, adjust the chain numbers, scale resources... through dashboards.

## [Getting Started](tutorial)

For new users, it is highly recommended to read the [Tutorial for Beginners](tutorial) first.

## Operation Guideline
* [Terminology and Concept](terminology)
* [Installation](installation)
* [Adoption Scenarios](scenario)
* [Configuration for Production](production_config)
* [Manage Cello services](service_management)

## Contribute to the Project
* [How to Contribute](CONTRIBUTING)
* [Coding Style](code_style)
* [PEP8 Style Guide](https://www.python.org/dev/peps/pep-0008/)
* [Develop react js](reactjs)
* [Develop vue theme](vue/index)

## Design Documentation
* [Architecture Design](arch)
* [Database Model](db)
* [API Design](api/restserver_v2)

## Communication Channels

For additional helps, feel free to take the following channels:

* [Wikipage](https://wiki.hyperledger.org/projects/cello): Lots of information and documentation about the project.
* [Jira Board](https://jira.hyperledger.org/projects/CE/issues): Find development status, report bug, or help contribute code.
* [Mail List](mailto:hyperledger-cello@lists.hyperledger.org): General discussions with Cello project.
* [Rocket.Chat channels](https://chat.hyperledger.org/channel/cello): Real-time technical conversations.

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
