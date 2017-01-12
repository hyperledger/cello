# Database Design

We have several collections, as follows.

## Host
Track the information of a Host. 

A typical host may look like:

id |  name   | daemon_url          | create_ts      | capacity | status | clusters  | type    | log_level | log_type | log_server  | autofill | schedulable
---|  ------ | ------------------- | -------------- | -------- | -------- | ------- | ------- | --------- | -------- | ----------- | -------- | -----------
xxx | host_0 | tcp://10.0.0.1:2375 | 20160430101010 | 20       | active | [c1,c2,c3] | single | debug     | syslog   | udp://10.0.0.2:5000 | true | true

* id (str): uuid of the host instance
* name (str): human-readable name
* daemon_url (str): Through which url to access the Docker/Swarm Daemon
* create_ts (datetime): When to add the host
* capacity (int): Maximum number of chains on that host
* status (str): 'active' (Can access daemon service) or 'inactive' (disconnected from daemon service)
* clusters (list): List of the ids of those chains on that host
* type (str): 'singe' (single Docker host) or 'swarm' (Docker Swarm cluster)
* log_level (str): logging level for chains on the host, e.g., 'debug', 'info', 'warn', 'error'
* log_type (str): logging type for chains on the host, 'local' or 'syslog'
* log_server (str): log server address, only valid when `log_type` is 'syslog'
* autofill (str): whether to autofill the server to its capacity with chains, 'true' or 'false' 
* schedulable (str): whether to schedule a chain request to that host, 'true' or 'false', useful when maintain the host

## Cluster
Track information of one blockchain.

A typical cluster may look like:

id  | service_url         | name      | user_id  | host_id | daemon_url          | consensus_plugin | consensus_mode | create_ts      | apply_ts | release_ts | duration | size | containers | health
--- | --------------- | --------- | -------- | ------- | ------------------- | ---------------- | -------------- | -------------  | -------- | ---------- | ------- | ------- | ------- | ------
xxx | {}   | cluster_A | ""       | host_xx |  tcp://10.0.0.1:2375 | pbft            | batch          | 20160430101010 | 20160430101010 | | | 4  | [vp0,vp1,vp2,vp3] | OK

* id (str): uuid of the host instance
* service_url (dict): urls to access the services on the chain, e.g., {'rest':10.0.0.1:7050, 'grpc':10.0.0.1:7051}
* name (str): human-readable name
* user_id (str): Which user occupies this chain, empty for no occupation
* host_id (str): Where the chain exists
* daemon_url (str): Through which url to access the Docker/Swarm Daemon
* consensus_plugin (str): Consensus plugin name
* consensus_mode (str): Consensus plugin mode name
* create_ts (datetime): When to create the chain
* apply_ts (datetime): When the chain is applied
* release_ts (datetime): When to release the chain
* duration (str): How long the chain lives
* size (int): Peer nodes number of the chain
* containers (list): List of the ids of those containers for the chain
* health (str): 'OK' (healthy status) or 'Fail' (Not healthy)
