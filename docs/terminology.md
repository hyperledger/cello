# Terminology

## Overview

The Cello system is suggested to be deployed on multiple servers, at least 1 Master Node + 1 Worker Node.

* `Master` Node: Running Cello services, which will manage the worker nodes.
* `Worker` Node: The servers to have blockchains running inside. The worker nodes will be managed by the master node.
* `Host`: Host is a resource pool managed by a unique control point, which consists of several compute nodes. Typically it can be a naive Docker host, a Swarm cluster or other bare-metal/virtual/container clusters.
* `Chain` (`Cluster`): A blockchain network including numbers of peer nodes. E.g., a Hyperledger Fabric network, a Sawthooth Lake or Iroha chain.


## Master

The `Master` Node will hold the main Cello [services](service_management.md).

This node is the control point of the whole Cello cluster, and most of the management work should be taken here.

`Master` node will manage the blockchain networks running inside the `Worker` nodes.

## Worker

`Worker` nodes will be managed by the `Host`'s control service, and hold the blockchains.

## Hosts

A host is a group of worker nodes managed by the same resource controller, which can be a native Docker Host or a Swarm Cluster currently.

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