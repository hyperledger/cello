# Terminology

## Overview

It is suggested to deploy Cello on multiple servers, at least 1 Master + N (N>=1) Workers.

* `Master`: Management node to run Cello services.
* `Worker`: Platforms (e.g., Docker, Swarm, Kubernetes, vSphere Cloud) to host blockchains. The `Worker` will be managed by the `Master`.
* `Host`: Typical `worker` that the resource will be managed by a unique platform. Typically it can be a naive Docker host, a Swarm cluster, a Kubernetes clsuter, or other bare-metal/virtual/container clusters.
* `Chain` (`Cluster`): Blockchain network including numbers of peer+orderer nodes. E.g., a Hyperledger Fabric network, a Sawthooth Lake or Iroha chain.

## Master

The `Master` will hold the main Cello [services](service_management.md).

This is the control panel of the whole Cello service, and most of the management work should be handled here.

`Master` will manage the blockchain networks running inside the `Workers`.

## Worker

`Workers` will be managed by the `Master` service, and help host the blockchains.

## Hosts

A host is a group of resources managed by the same resource controller, which can be a native Docker Host, a Swarm Cluster, a Kubernetes Cluster, or some Cloud currently.

Usually a host has several properties:

* `Name`: Alias name for human read convenience.
* `Daemon URL`: The url for Docker/Swarm Access.
* `Capacity`: How many chains the host can have at most.
* `Logging Level`: The default logging level for the chains at this host.
* `Logging Type`: How to handle those logging messages.
* `Schedulable`: The chains on this hosts are available to be scheduled to users.
* `Autofill`: Always automatically fill the hosts full with chains.

##  Chain

A chain is typically a blockchain cluster, e.g., a fabric network.

A Chain has several properties:

* `Name`: Alias name for human readiness.
* `Host`: Which host the chain locates.
* `Size`: How number nodes does the chain have.
* `Consensus`: What kind of consensus does the chain adopts, depending on the blockchain technology.

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.