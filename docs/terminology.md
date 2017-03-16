# Terminology


## Overview
* Cluster | Chain: A blockchain with unique access API address, including several peer nodes. May support Hyperledger Fabric, SawthoothLake and Iroha.
* Host: A resource server, usually it can be a naive Docker host or a Swarm cluster.
* Master Node: Running the cello platform, to manage the compute nodes.
* Compute | Worker Node: The servers to have blockchains running inside.



## Hosts

A host is a worker node, which can be a native Docker Host or a Swarm Cluster currently. Usually a host has several properties:

* Name: Alias name for human read convenience.
* Daemon URL: The url for Docker/Swarm Access.
* Capacity: How many chains the host can have at most.
* Logging Level: The default logging level for the chains at this host.
* Logging Type: How to handle those logging messages.
* Schedulable: The chains on this hosts are available to be scheduled to users.
* Autofill: Always automatically fill the hosts full with chains.


##  Chain

A chain is typically a blockchain cluster, e.g., a fabric network, with properties including:

* Name: Alias name for human readiness.
* Host: Which host the chain locates.
* Size: How number nodes does the chain have.
* Consensus: What kind of consensus does the chain adopts, depending on the blockchain technology.
