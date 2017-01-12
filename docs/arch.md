# Architecture Design

Here we discuss the architecture design for the mangement services on the Master node.

## Terminology
* Cluster | Chain: A blockchain with unique access API address, including several peer nodes. May support Hyperledger Fabric, SawthoothLake and Iroha.
* Host: A resource server, usually it can be a naive Docker host or a Swarm cluster.
* Master Node: Running the cello platform, to manage the compute nodes.
* Compute | Worker Node: The servers to have blockchains running inside.

## Philosophy and principles
The architecture will follow the following principles:

* Micro-service: Means we decouple various functions to individual micro services. No service will crash others whatever it does.
* Fault-resilience: Means the service should be tolerant for fault, such as database crash. 
* Scalability: Try best to distribute the services, to mitigate centralized bottle neck.


## Components

![Architecture Overview](imgs/architecture.png)

* `dashboard`: Provide the dashboard for the pool administrator, also the core engine to automatically maintain everything.
* `restserver`: Provide the restful api for other system to apply/release/list chains.
* `watchdog`: Timely checking system status, keep everything healthy and clean.

## Implementation

The restful related implementation is based on [Flask](flask.pocoo.org), a Werkzeug based micro-framework for web service.

I choose it for:

* Lightweight
* Good enough in performance
* Flexible for extending
* Stable in code
