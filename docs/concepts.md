hero: All concepts related to cello

## 1. [Server](setup/server.md)

### 1.1 Components [^1]

#### 1.1.1 API Engine

Api engine supply the core function, all operations through the api service.

Host path mappings:

* /opt/cello/api-engine/media:/var/www/media {>>store all media files<<}
* /var/run/docker.sock:/var/run/docker.sock {>>Used for agent containers launch, which will deploy fabric, eg. network<<}
* (==optional==) $ROOT_PATH/src/api-engine:/var/www/server {>>When run in debug mode, MODE=dev, will mapping the source code into container, ROOT_PATH is the source code path.<<}

#### 1.1.2 API Engine Tasks

This component run all the async longtime task for api engine, it's receive tasks through redis, and can dynamic set the thread pool.

```

#### 1.1.3 Postgres

Store all the data in postgres database, and the storage path is mapping out on the host.

Host path mappings:

* /opt/cello/postgres:/var/lib/postgresql/data {>>Store all db data.<<}

#### 1.1.4 Redis

#### 1.1.5 Dashboard

### 1.2 Deployment Method

#### 1.2.1 Docker compose

#### 1.2.2 Kubernetes

## 2. Agent

### 2.1 [Kubernetes](agents/kubernetes.md)

### 2.2 [Fabric Operator](agents/fabric-operator.md)

[^1]: running containers of cello master service

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
```
