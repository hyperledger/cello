**Note:** This is a **read-only mirror** of the formal [Gerrit](https://gerrit.hyperledger.org/r/#/admin/projects/cello) repository. Find more details at [Cello Wiki](https://wiki.hyperledger.org/projects/cello).

![Cello](docs/imgs/logo.png)

Hyperledger Cello is a blockchain provision and operational system, which helps provide Blockchain as a Service.

## Introduction
Using Cello, everyone can easily:

* Provision customizable Blockchains instantly, e.g., a Hyperledger fabric network.
* Maintain a pool of running blockchains atop of baremetals, vms, Docker Swarm and Kubernetes.
* Check the system status, adjust the chain numbers, scale resources... through a dashboard.

A typical usage scenario is illustrated as:

![Typical Scenario](docs/imgs/scenario.png)

## Main Features
* Manage the lifecycle of blockchains, e.g., create/start/stop/delete/keep health automatically.
* Support customized (e.g., size, consensus) blockchains request, currently we mainly support [Hyperledger fabric](https://github.com/hyperledger/fabric).
* Support native Docker host, swarm or Kubernetes as the worker nodes. More supports on the way.
* Support heterogeneous architecture, e.g., X86, POWER and Z, from bare-metal servers to virtual machines.
* Extend with monitor, log, health and analytics features by employing additional components.

## Documentation, Getting Started and Develop Guideline
For new users, it is highly recommended to read the [tutorial](docs/tutorial.md) or [index](docs/index.md) first.

And feel free to visit the [online documentation](http://cello.readthedocs.io/en/latest/) for more information. You can also run `make doc` to start a local documentation website (Listen at [localhost:8000](http://127.0.0.1:8000).

## Why named Cello?
Can you find anyone better at playing chains? :)

## Incubation Notice
This project is a Hyperledger project in _Incubation_. It was proposed to the community and documented [here](https://docs.google.com/document/d/1E2i5GRqWsIag7KTxjQ_jQdDiWcuikv3KqXeuw7NaceM/edit), and was approved by [Hyperledger TSC at 2017-01-07](https://lists.hyperledger.org/pipermail/hyperledger-tsc/2017-January/000535.html). Information on what _Incubation_ entails can be found in the [Hyperledger Project Lifecycle document](https://goo.gl/4edNRc).

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.