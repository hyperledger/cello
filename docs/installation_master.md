## Master Node Setup
The Master Node includes several services:

* dashboard: Provide Web UI for operators.
* restserver: Provide RESTful APIs for chain consumers.
* watchdog: Watch for health checking.

*More details can be found at the [architecture doc](./arch.md).*

It can be deployed by in 2 steps.

* Clone code
* Run setup script

### System Requirement
* Hardware: 8c16g100g
* Docker engine: 1.10.0~1.13.0 (Docker 17.0+ support is experimental)
* docker-compose: 1.8.0~1.12.0

### Clone Code

You may check `git` and `make` are installed to clone the code.

```sh
$ sudo aptitude install git make -y
$ git clone http://gerrit.hyperledger.org/r/cello && cd cello
```
### Command help - make

To know more what the following make commands does please refer [make_support](./make_support.md) page.

### Run Setup

For the first time running, please setup the master node with the [setup.sh](https://github.com/hyperledger/cello/blob/master/scripts/master_node/setup.sh).

```sh
$ make setup-master
```

Make sure there is no error during the setup. Otherwise, please check the log msgs.

### Usage

#### Start/Stop/Restart
To start the whole services, please run

```sh
$ make start
```

To stop or restart the whole services, run `make stop` or `make restart`.

#### Redploy a service
To redeploy one specific service, e.g., dashboard, please run

```sh
$ make redeploy service=dashboard
```

#### Check Logs
To check the logs for all the services, please run

```sh
$ make logs
```

To check the logs for one specific service, please run
```sh
$ make log service=watchdog
```

Now you can access the `MASTER_NODE_IP:8080` to open the Web-based [operational dashboard](./dashboard.md).


### Configuration
The application configuration can be imported from file named `CELLO_CONFIG_FILE`.

By default, it also loads the `config.py` file as the configurations.

### Data Storage
The mongo container will use local `/opt/cello/mongo` directory for persistent storage.

Please keep it safe by backups or using more high-available solutions.

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
