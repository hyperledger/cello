
# Copyright IBM Corp., All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

##This part of Cello deploys **Fabric over Kubernetes**
---
Note: This guide assumes that you already have running Kubernetes Cluster with a master and n-nodes.

###--Steps to Deploy--

1. Prepare crypto-config.yaml and configtx.yaml in "driving-files" Directory.

2. Run "generateArtifacts.sh" script in "driving-files" directory to create "orderer.genesis.block"
    ```
    $ cd driving-files
    $ bash generateArtifacts.sh <channel-name>

    note: If you don't wish to provide a channel-name, then
    by default, genesis block will be created for a channel name "mychannel"
    ```

3. Now, all the artifacts are generated, finally run:
    ```$ bash prepare-files.sh```

4. Now, Copy "driving-files" directory to all the nodes, i.e.
    Master along with all the nodes.

5. On Master, run "run.sh"
    ```$ bash run.sh```

6. Now, Kube-DNS and Nginx Stream Proxy has been setted up.

7. Setting up the environment variables
```$ export NGINX_PROXY_DNS=<your master-node ip-address>```

8. Add this setting to Docker running on all nodes
 ``` Environment=DOCKER_OPT_DNS=--dns=<Master node   IP-address>

    ExecStart=/usr/bin/dockerd -H fd:// \
    $DOCKER_OPTS $DOCKER_OPT_BIP $DOCKER_OPT_MTU \
    $DOCKER_OPT_DNS
```

9. Now, time to restart the docker daemon
```$ systemctl daemon-reload && systemctl restart docker```

10. Deploy the cluster
```$ bash run deploy.sh```

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
