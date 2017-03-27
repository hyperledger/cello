# Architecture Design

Here we discuss the architecture design for the mangement services on the Master node.



## Philosophy and principles
The architecture will follow the following principles:

* Micro-service: Means we decouple various functions to individual micro services. No service will crash others whatever it does.
* Fault-resilience: Means the service should be tolerant for fault, such as database crash. 
* Scalability: Try best to distribute the services, to mitigate centralized bottle neck.

## Functional Layers

Following the decouple design, there are 3 layers in Cello.

* Access layer: including those Web UI dashboards operated by users.
* Orchestration layer: received the request form Access layer, and make call to correct agents to operate the blockchain resources.
* Agent layer: real workers that interact with underly infrastructures like Docker, Swarm, K8s.

Each layer should maintain stable APIs for upper layers, to achieve pluggability without changing upper layer code.

### Agent layer APIs

* Host management: create, query/list, update, delete, fillup, clean, reset
* Cluster management: create, query/list, start/stop/restart, delete, reset

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
