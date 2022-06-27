## 1. System Requirement

* Hardware: 4c8g100g
* Linux Kernel >= 3.0.0
* Docker engine: 17.15.5+
* docker-compose: 1.24.1+

## 2. Setup Steps

### 2.1 Clone source code

```bash
$ git clone https://github.com/hyperledger/cello.git
```

### 2.2 Prepare environment

1. docker [how install](https://get.docker.com)
2. docker-compose [how install](https://docs.docker.com/compose/install/)
3. make `all script for cello service management is written in Makefile`
4. kubernetes (`optional`) [how install](https://kubernetes.io/docs/setup/)
5. node [how install](https://nodejs.org/en/download/)

### 2.3 Build local images(optional)

* Because currently the dockerhub image auto build haven't ready, in the future you can ignore this step.
  * Build API Engine
    ```bash
    $ make api-engine
    ```
  * Build Docker Agent
    ```bash
    $ make docker-rest-agent
    ```
  * Build Docker Dashboard
    ```bash
    $ make dashboard
    ```

### 2.4 Start service

* Start cello service.

  ```bash
  $ make start
  ```

## 3. Troubleshoot


### 3.1 Error after running ```make start```
  * Mounts denied error when using Docker Desktop
    * Error message:
      ```bash
      Error response from daemon: Mounts denied:
      The path /opt/cello is not shared from the host and is not known to Docker.
      You can configure shared paths from Docker -> Preferences... -> Resources -> File Sharing.
      See https://docs.docker.com/ for more info.
      make[1]: *** [Makefile:215: start-docker-compose] Error 1
      ```
    * Solution:
      ```bash
      $ sudo mkdir /opt/cello
      
      # Then go to Docker Desktop -> Preferences... -> Resources -> File Sharing
      # Add the path /opt/cello into the File Sharing list, apply the change and restrt Docker Desktop
      ```

### 3.2 Unable to register
  * Docker has no access to the folder ```/opt/cello```
    * Error message in HTTP response:
      ```
      msg	[ "CryptoConfig create failed for [Errno 2] No such file or directory: '/opt/cello/${your organization name}/crypto-config.yaml'!" ]
      ```
    * First try
      ```bash
      $ sudo make start
      ```
    * If there is any error or you still cannot register, change the permission of the folder
      ```bash
      $ sudo chown -R !(whoami): /opt/cello
      ```

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
