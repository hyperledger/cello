# Release Notes

## [v0.9.0-alpha](https://github.com/hyperledger/cello/releases/tag/v0.9.0-alpha) September 9, 2018

### Add new features

* Support kubernetes agent deploy fabric;
* Support fabric v1.2 in user dashboard;

### Improvement

* Move long time task into async task queue in background;
* Refine dockerfile for operator dashboard;

### Known Vulnerabilities
none

### Resolved Vulnerabilities
none

### Known Issues & Workarounds

* Kubernetes agent can't deploy fabric v1.2, and can't be used in user dashboard;
* In user dashboard create, join channel for fabric v1.2, will cause peer node restart random;

## [v0.8.0](https://github.com/hyperledger/cello/releases/tag/v0.8.0) March 28, 2018

### Add new features

none

### Improvement

* Documentation typos.
* Update tutorial.
* Allow logging level to be configurable

### Known Vulnerabilities
none

### Resolved Vulnerabilities
* Fix user dashboard image build fail.
* Fix the incompatibility with vSphere host type

### Known Issues & Workarounds

none

## [v0.8.0-beta](https://github.com/hyperledger/cello/releases/tag/v0.8.0-beta) March 4, 2018

### Add new features

none

### Improvement

* Support pulling newest docker images in Makefile.
* Add dev/production start options for service deploy.
* Derive AMI ID, allow custom Subnet/VPC.

### Known Vulnerabilities
none

### Resolved Vulnerabilities
* Fix start scripts for user dashboard.
* Fix health check bug.
* Fix the misplaced double quotes.
* Upgrade fabric client version in user dashboard
* Fix ca, tls files error in compose files for fabric client.

### Known Issues & Workarounds

* Deploying smart contract in user dashboard is not finished.

## [v0.8.0-alpha](https://github.com/hyperledger/cello/releases/tag/v0.8.0-alpha) January 20, 2018

### Add new features

* Blockchain-Explorer support;
* Enable user dashboard, can apply chain, query block/transaction, upload/invoke/query chain code;
* Support v3 docker compose format;
* Support fabric 1.0.5;
* Support fabric with kafaka mode;
* Enable creating/hosting service images at dockerhub;

### Improvement

* Use mongoengine instead of mongodb library for admin dashboard.

### Known Vulnerabilities
none

### Resolved Vulnerabilities
none

### Known Issues & Workarounds

* Health check should ignore blockchain explorer port.
* Cluster's user_id should be empty when the chain is created.
* User dashboard does not support debug/product mode.

## [v0.7](https://github.com/hyperledger/cello/releases/tag/v0.7) October 20, 2017

### Add new features:

* Support fabric 1.0 network;
* Support ansible-based fabric deployment on baremetal and Cloud env;
* Support user management api and dashboard;
* Start vSphere & Kubernetes Agent support.
* Add vue theme.
* Make agent layer pluggable

### Improvement:

* Improve RESTful api code for admin dashboard.

### Known Vulnerabilities
none

### Resolved Vulnerabilities
none

### Known Issues & Workarounds
When using Cello on MacOS, the mongodb container may fail to start. This is
because the container will try to mount `/opt/cello/mongo` path. To resolve
the problem, users need to add `/opt/cello` to Docker's sharing path.

### Change Log
[https://github.com/hyperledger/cello/blob/master/CHANGELOG.md#v07](https://github.com/hyperledger/cello/blob/master/CHANGELOG.md#v07)

## [v0.6](https://github.com/hyperledger/cello/releases/tag/v0.6) June 24, 2017

### Add new features:

* Support fabric 0.6 network;
* Support docker swarm;
* Add admin dashboard;
* Add core engine;

### Improvement:

none

### Known Vulnerabilities
none

### Resolved Vulnerabilities
none

### Known Issues & Workarounds
none

### Change Log
[https://github.com/hyperledger/cello/blob/master/CHANGELOG.md#v06](https://github.com/hyperledger/cello/blob/master/CHANGELOG.md#v06)
