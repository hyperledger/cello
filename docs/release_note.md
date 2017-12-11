# Release Notes

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
